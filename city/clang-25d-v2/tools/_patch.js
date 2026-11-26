const fs=require('fs');const [,,file,a,b,out]=process.argv;const s=fs.readFileSync(file,'utf8');
const i=s.indexOf(a),j=s.indexOf(b);if(i<0||j<0||j<i){console.log('MARKER MISS',i,j);process.exit(1)}
fs.writeFileSync(file,s.slice(0,i)+fs.readFileSync(out,'utf8')+s.slice(j));console.log('patched',file,i,j);
