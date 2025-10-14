export const attachCurrentAdmin = (req, res, next) => {
  req.currentAdmin = req.user;
  console.log("middleware:currentAdmin: ", req.currentAdmin);
  next();
};
