import dotenv from 'dotenv';
dotenv.config();

const API_KEYS = {
  NTC_ADMIN: process.env.NTC_ADMIN_API_KEY,
  OPERATOR: process.env.OPERATOR_API_KEY,
  PUBLIC: process.env.PUBLIC_API_KEY
};

export const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key is required',
      message: 'Please provide an API key in the x-api-key header' 
    });
  }
  
  // Determining user role based on the API key
  
  if (apiKey === API_KEYS.NTC_ADMIN) {
    req.userRole = 'NTC_ADMIN';
  } else if (apiKey === API_KEYS.OPERATOR) {
    req.userRole = 'OPERATOR';
  } else if (apiKey === API_KEYS.PUBLIC) {
    req.userRole = 'PUBLIC';
  } else {
    return res.status(403).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is not valid' 
    });
  }
  
  next();
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This endpoint requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }
    next();
  };
};