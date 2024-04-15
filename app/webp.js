const webp=require('webp-converter');
const result = webp.cwebp("static/css/b.png","static/css/b.webp","-q 0",logging="-v");
result.then((response) => {
  console.log(response);
});
