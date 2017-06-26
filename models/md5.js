exports.md5=function (str) {
  // console.log(typeof str);
  const cryto=require('crypto');
  const hash=cryto.createHash('md5');
  return hash.update(str).digest('base64')
};
