# Runs every question's code with the real Ruby and checks that the marked answer is right.
require "yaml"
require "open3"
require "tmpdir"
require "json"

# Usage: ruby verify.rb [ruby-silver|ruby-gold]  (no argument: every exam)
# Keep these lists in the same order as `files` in src/lib/exams.ts.
EXAMS = {
  "ruby-silver" => %w[q_syntax q_lib q_oop q_syntax2 q_lib2 q_oop2 q_extra q_official],
  "ruby-gold" => %w[g_syntax g_oop g_lib g_stdlib g_official g_syntax2 g_oop2 g_lib2 g_stdlib2],
}
BLANK = "__(1)__"

def norm(s)
  s.to_s.gsub("\r\n", "\n").lines.map(&:rstrip).join("\n").sub(/\n+\z/, "")
end

def run_ruby(src, env = {})
  Dir.mktmpdir do |dir|
    path = File.join(dir, "q.rb")
    File.write(path, src)
    out, err, st = Open3.capture3(env, "timeout", "10", "ruby", path, chdir: dir, stdin_data: "")
    { out: out, err: err, ok: st.success?, status: st.exitstatus }
  end
end

def err_class(err)
  err[/\(([A-Z]\w*(?:::\w+)*)\)\s*$/, 1] || err[/: ([A-Z]\w*Error)\b/, 1] || err[/\b([A-Z]\w*Error)\b/, 1]
end

def verify(exam, files)
  questions = files.flat_map { |f| YAML.load_file(File.join(__dir__, "src/data", exam, "#{f}.yml")) }
  failures = []
  $seen = {}
  questions.each_with_index do |q, i|
    id = i + 1
    label = "#{exam} Q#{id} [#{q['cat']}/#{q['topic']}]"
    ans = q["answer"].sort
    # `env` sets environment variables for the run, e.g. TZ for questions whose output depends on the time zone
    env = (q["env"] || {}).transform_values(&:to_s)
    run = ->(src) { run_ruby(src, env) }
    case q["verify"]
    when "output"
      r = run.(q["code"])
      if !r[:ok]
        failures << "#{label}: code raised: #{r[:err].lines.first}"
        next
      end
      actual = norm(r[:out])
      expected = norm(q["choices"][ans[0]])
      matches = q["choices"].each_index.select { |k| norm(q["choices"][k]) == actual }
      if actual != expected || matches != ans
        failures << "#{label}: actual output:\n#{actual}\n---expected (choice #{ans[0]}):\n#{expected}"
      end
    when "run"
      r = run.(q["code"])
      exp = q["expect"] || {}
      problems = []
      problems << "stdout #{norm(r[:out]).inspect} != #{norm(exp['out']).inspect}" if exp.key?("out") && norm(r[:out]) != norm(exp["out"])
      if exp["error"]
        c = err_class(r[:err])
        problems << "expected #{exp['error']} but got #{c.inspect} (ok=#{r[:ok]}) #{r[:err].lines.first}" if r[:ok] || c != exp["error"]
      elsif exp.key?("status")
        problems << "exit status #{r[:status]} != #{exp['status']}" if r[:status] != exp["status"]
      else
        problems << "unexpected error: #{r[:err].lines.first}" unless r[:ok]
      end
      problems << "stderr is not empty: #{r[:err]}" if exp["quiet"] && !r[:err].empty?
      problems << "stderr lacks #{exp['stderr'].inspect}: #{r[:err]}" if exp["stderr"] && !r[:err].include?(exp["stderr"])
      failures << "#{label}: #{problems.join('; ')}" unless problems.empty?
    when "blank"
      # without `code`, each choice is a whole program ("which code prints this?")
      template = q["code"] || BLANK
      raise "#{label}: no blank" unless template.include?(BLANK)
      good = q["choices"].each_index.select do |k|
        r = run.(template.gsub(BLANK) { q["choices"][k] })
        r[:ok] && norm(r[:out]) == norm(q["result"])
      end
      good = q["choices"].each_index.to_a - good if q["negate"]
      failures << "#{label}: choices #{q['negate'] ? 'NOT ' : ''}producing result = #{good}, marked = #{ans}" if good != ans
    when "checks"
      # `setup` replaces the shown code when the code itself can't run (e.g. it has a blank)
      setup = q.key?("setup") ? q["setup"].to_s : q["code"].to_s
      truthy = q["checks"].each_index.select do |k|
        r = run.(setup + "\n" + q["checks"][k] + "\n")
        r[:ok]
      end
      failures << "#{label}: true checks = #{truthy}, marked = #{ans}" if truthy != ans
    else
      failures << "#{label}: unknown verify type #{q['verify'].inspect}"
    end
    # sanity: choices distinct, answer count matches wording
    norms = q["choices"].map { |c| norm(c) }
    failures << "#{label}: duplicate choices" if norms.uniq.size != norms.size
    want = q["q"][/([2-9])つ選択/, 1]&.to_i || 1
    (seen_code ||= {})
    if q["code"]
      key = q["code"].gsub(/\s+/, "")
      failures << "#{label}: same code as Q#{$seen[key]}" if $seen[key]
      $seen[key] ||= id
    end
    failures << "#{label}: answer count #{ans.size} vs wording (#{want})" if ans.size != want
  end

  puts "Ruby #{RUBY_VERSION} / #{exam}: #{questions.size} questions"
  failures
end

names = ARGV.empty? ? EXAMS.keys : ARGV
failures = names.flat_map { |name| verify(name, EXAMS.fetch(name)) }
if failures.empty?
  puts "ALL OK"
else
  puts failures.map { |f| "✗ #{f}" }.join("\n\n")
  exit 1
end
