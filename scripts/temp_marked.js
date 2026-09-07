
const fs = require('fs');
const { marked } = require('marked');
const md = fs.readFileSync('C:\\Users\\krada\\OneDrive\\Desktop\\HRMSEmployee_NextJs\\DOCUMENTATION.md', 'utf8');
const html = marked.parse(md);
fs.writeFileSync('C:\\Users\\krada\\OneDrive\\Desktop\\HRMSEmployee_NextJs\\DOCUMENTATION.html', html);
