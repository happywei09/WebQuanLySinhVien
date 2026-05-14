const fs = require('fs');
const files = ['lop.html', 'sinhvien.html', 'giangvien.html', 'monhoc.html', 'loptinchi.html', 'dangky.html'];
files.forEach(file => {
  const path = 'frontend/pages/' + file;
  let content = fs.readFileSync(path);
  let str = content.toString('utf8').replace(/\0/g, '');
  str = str.replace(/<\s*s\s*c\s*r\s*i\s*p\s*t\s*s\s*r\s*c\s*=\s*.*?s\s*c\s*r\s*i\s*p\s*t\s*>/g, '');
  str = str.replace(/<script src=.*?<\/script>/g, '');
  const moduleName = file.replace('.html', '.js');
  str = str.trim() + '\n<script src="js/modules/' + moduleName + '"></script>\n';
  fs.writeFileSync(path, str);
});
console.log("Done");
