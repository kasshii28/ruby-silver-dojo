# Runs every question's code with the real Ruby and checks that the marked answer is right.
require "yaml"
require "open3"
require "tmpdir"
require "json"

FILES = %w[q_syntax.yml q_lib.yml q_oop.yml q_syntax2.yml q_lib2.yml q_oop2.yml q_extra.yml].map { |f| File.join(__dir__, f) }
BLANK = "__(1)__"

def norm(s)
  s.to_s.gsub("\r\n", "\n").lines.map(&:rstrip).join("\n").sub(/\n+\z/, "")
end

def run_ruby(src)
  Dir.mktmpdir do |dir|
    path = File.join(dir, "q.rb")
    File.write(path, src)
    out, err, st = Open3.capture3("timeout", "10", "ruby", path, chdir: dir, stdin_data: "")
    { out: out, err: err, ok: st.success?, status: st.exitstatus }
  end
end

def err_class(err)
  err[/\(([A-Z]\w*(?:::\w+)*)\)\s*$/, 1] || err[/: ([A-Z]\w*Error)\b/, 1] || err[/\b([A-Z]\w*Error)\b/, 1]
end

questions = FILES.flat_map { |f| YAML.load_file(f) }
failures = []
$seen = {}
questions.each_with_index do |q, i|
  id = i + 1
  label = "Q#{id} [#{q['cat']}/#{q['topic']}]"
  ans = q["answer"].sort
  case q["verify"]
  when "output"
    r = run_ruby(q["code"])
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
    r = run_ruby(q["code"])
    exp = q["expect"] || {}
    problems = []
    problems << "stdout #{norm(r[:out]).inspect} != #{norm(exp['out']).inspect}" if exp.key?("out") && norm(r[:out]) != norm(exp["out"])
    if exp["error"]
      c = err_class(r[:err])
      problems << "expected #{exp['error']} but got #{c.inspect} (ok=#{r[:ok]}) #{r[:err].lines.first}" if r[:ok] || c != exp["error"]
    else
      problems << "unexpected error: #{r[:err].lines.first}" unless r[:ok]
    end
    problems << "stderr lacks #{exp['stderr'].inspect}: #{r[:err]}" if exp["stderr"] && !r[:err].include?(exp["stderr"])
    failures << "#{label}: #{problems.join('; ')}" unless problems.empty?
  when "blank"
    raise "#{label}: no blank" unless q["code"].include?(BLANK)
    good = q["choices"].each_index.select do |k|
      r = run_ruby(q["code"].sub(BLANK) { q["choices"][k] })
      r[:ok] && norm(r[:out]) == norm(q["result"])
    end
    good = q["choices"].each_index.to_a - good if q["negate"]
    failures << "#{label}: choices #{q['negate'] ? 'NOT ' : ''}producing result = #{good}, marked = #{ans}" if good != ans
  when "checks"
    setup = q["code"].to_s
    truthy = q["checks"].each_index.select do |k|
      r = run_ruby(setup + "\n" + q["checks"][k] + "\n")
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

puts "Ruby #{RUBY_VERSION} / #{questions.size} questions"
if failures.empty?
  puts "ALL OK"
else
  puts failures.map { |f| "✗ #{f}" }.join("\n\n")
  exit 1
end
