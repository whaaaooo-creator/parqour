var fso = new ActiveXObject("Scripting.FileSystemObject");
var ts = fso.OpenTextFile("autofetch.html", 1, false, -1);
var html = ts.ReadAll();
ts.Close();
var re = /<script[^>]*>([\s\S]*?)<\/script>/g;
var m, i = 0;
while ((m = re.exec(html)) !== null) {
  try {
    new Function(m[1]);
    WScript.Echo("script " + i + " ok");
  } catch (e) {
    WScript.Echo("script " + i + " error: " + e.message);
  }
  i++;
}
