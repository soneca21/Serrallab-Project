const fs = require('fs');
const p = 'src/pages/app/ConfigCanaisPage.tsx';
let t = fs.readFileSync(p, 'utf8');
const reps = {
  'automa\u2021\u00e4es': 'automa\u00e7\u00f5es',
  'Configura\u2021\u00c6o': 'Configura\u00e7\u00e3o',
  'Hist\u00a2rico': 'Hist\u00f3rico',
  '\u00a3nico': '\u00fanico',
  'exclu\u00a1da': 'exclu\u00edda',
  'execu\u2021\u00e4es': 'execu\u00e7\u00f5es'
};
for (const [a, b] of Object.entries(reps)) {
  t = t.split(a).join(b);
}
const tabsBlock = new RegExp('<TabsList[\\s\\S]*?<\\/TabsList>');
const tabsReplacement = '<div className="inline-flex rounded-xl border border-surface-strong bg-surface p-1 shadow-sm mb-4">\n'
  + '                            <TabsList className="bg-transparent p-0">\n'
  + '                                <TabsTrigger value="config">Configura\u00e7\u00e3o</TabsTrigger>\n'
  + '                                <TabsTrigger value="history">Hist\u00f3rico</TabsTrigger>\n'
  + '                                <TabsTrigger value="automation">Automa\u00e7\u00f5es</TabsTrigger>\n'
  + '                            </TabsList>\n'
  + '                        </div>';
if (tabsBlock.test(t)) {
  t = t.replace(tabsBlock, tabsReplacement);
}
fs.writeFileSync(p, t, 'utf8');
