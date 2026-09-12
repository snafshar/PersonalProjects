import {execFileSync} from 'node:child_process';
const files=execFileSync('git',['diff','--cached','--name-only','--diff-filter=ACMR','-z']).toString().split('\0').filter(Boolean);
const pattern=/(?:[sr]k_(?:live|test)_[A-Za-z0-9]{12,}|whsec_[A-Za-z0-9]{12,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY)/;
const rejected=files.filter(path=>{if(/\.(jpg|png|webp)$/i.test(path))return false;return pattern.test(execFileSync('git',['show',':'+path],{maxBuffer:16*1024*1024}).toString())});
if(rejected.length){console.error('Possible credentials in staged files: '+rejected.join(', '));process.exit(1)}
