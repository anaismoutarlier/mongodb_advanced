/**Example route handler wrapper */
const routeHandler = fn => async (req, res, next) => {
  fn(req, res, next).catch(error => {
    console.error(error);
    return res.status(500).json({
      result: false,
      error: error.message,
      stack: error.stack,
    });
  });
};

module.exports = routeHandler;
