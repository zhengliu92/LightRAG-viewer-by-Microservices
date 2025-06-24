import forge from "node-forge";

const publicKeyPem = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvNL2FTHG1+jWPZjKkv73
70XXAR/SvPIY92/EToQTzbQvLyTQCBuv6uyOfwI7A+5Do5+5fWz7Wqi6+fsCnhkq
5MN36O5Vq2VXfO7im+Crkg/d7RiN2GYhuecn6/R/oY6OXx2yNOl7c9aA8PbBhN8h
1CFRkdr0SuC4dxg4Bj3NTDxO594VGan2SLNNzFpA4ysevIwyKiWwbG3FysssI/FA
tkvPSkh9YfgA3US6vfcJbHCafDlhIIB6y792lpm4YnsOSxxdopjK5WyQzHavb0xZ
mcPBWp60PRmU2QBBqXHzlEDlsCUl6M8gPPxqD88MdF4yjzgHyGdB+qPkK10DW4IC
MwIDAQAB
-----END PUBLIC KEY-----`;

const encrypt = (data: string): string => {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encrypted = publicKey.encrypt(data, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });
  return forge.util.encode64(encrypted);
};

export default encrypt;
