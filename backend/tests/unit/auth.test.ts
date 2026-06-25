import { authMiddleware, requireRole } from '../../src/middleware/auth.middleware';
import { verifyToken } from '../../src/utils/jwt';
import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

jest.mock('../../src/utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {
      cookies: {},
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no token cookie is present', () => {
    authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.stringMatching(/unauthorized/i) });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next and attach user if token is valid', () => {
    const mockUser = { id: 'u1', email: 'test@nile.com', role: Role.CONSULTANT };
    mockReq.cookies = { token: 'valid_token' };
    (verifyToken as jest.Mock).mockReturnValue(mockUser);

    authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(verifyToken).toHaveBeenCalledWith('valid_token');
    expect(mockReq.user).toEqual(mockUser);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 401 if token verification throws error', () => {
    mockReq.cookies = { token: 'invalid_token' };
    (verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});

describe('Role Enforcement Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: undefined,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 403 if user role does not match required role', () => {
    mockReq.user = { id: 'u1', email: 'client@nile.com', role: Role.CLIENT };
    const middleware = requireRole(Role.CONSULTANT);

    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.stringMatching(/forbidden/i) });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next if user role matches required role', () => {
    mockReq.user = { id: 'u1', email: 'consultant@nile.com', role: Role.CONSULTANT };
    const middleware = requireRole(Role.CONSULTANT);

    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });
});
