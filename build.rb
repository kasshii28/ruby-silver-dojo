# Builds the site from the question YAML files and template2.html.
#   ruby-silver-dojo.html … single-file version (Claude artifact)
#   dist/index.html + dist/q1.js … q10.js … hosted version (Vercel)
require "yaml"
require "json"
require "fileutils"

dir = __dir__
files = %w[q_syntax.yml q_lib.yml q_oop.yml q_syntax2.yml q_lib2.yml q_oop2.yml q_extra.yml].map { |f| File.join(dir, f) }
qs = files.flat_map { |f| YAML.load_file(f) }

data = qs.each_with_index.map do |q, i|
  {
    id: i + 1,
    cat: q["cat"],
    topic: q["topic"],
    q: q["q"],
    code: q["code"],
    result: q["result"],
    choices: q["choices"].map(&:to_s),
    answer: q["answer"],
    cm: q.key?("cm") ? q["cm"] : %w[output blank].include?(q["verify"]),
    exp: q["exp"]
  }.compact
end

tpl = File.read(File.join(dir, "template2.html"))
raise "marker missing" unless tpl.include?("/*__DATA__*/[]")

json = JSON.generate(data).gsub("<", "\\u003c").gsub("\u2028", "\\u2028").gsub("\u2029", "\\u2029")
File.write(File.join(dir, "ruby-silver-dojo.html"), tpl.sub("/*__DATA__*/[]") { json })

CHUNK = 25
chunks = data.each_slice(CHUNK).to_a
body = tpl.sub(%r{\A<title>Ruby Silver 道場</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n}, "")
body = body.sub("/*__DATA__*/[]", "window.QUESTIONS || []")
tags = (1..chunks.size).map { |k| %(<script src="q#{k}.js"></script>) }.join("\n")
body = body.sub('<script src="https://cdnjs.cloudflare.com', tags + "\n" + '<script src="https://cdnjs.cloudflare.com')
head = <<~HTML
  <!doctype html>
  <html lang="ja">
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ruby Silver 道場</title>
  <meta name="description" content="Ruby技術者認定試験Silverのオリジナル問題を1問ずつ解いて、その場で正解と解説を確認できる学習サイト。">
  <style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
  </head>
  <body>
HTML
FileUtils.rm_rf(File.join(dir, "dist"))
FileUtils.mkdir_p(File.join(dir, "dist"))
File.write(File.join(dir, "dist/index.html"), head + body + "</body>\n</html>\n")
chunks.each_with_index do |c, k|
  js = "(window.QUESTIONS = window.QUESTIONS || []).push(\n" + c.map { |q| JSON.generate(q) }.join(",\n") + "\n);\n"
  File.write(File.join(dir, "dist/q#{k + 1}.js"), js)
end
puts "built #{data.size} questions: " + data.group_by { |q| q[:cat] }.map { |c, v| "#{c} #{v.size}" }.join(", ")
puts "dist: " + Dir[File.join(dir, "dist/*")].sort_by { |f| [f.length, f] }.map { |f| "#{File.basename(f)} #{File.size(f)}" }.join(", ")
