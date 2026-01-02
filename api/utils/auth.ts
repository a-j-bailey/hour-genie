/**
 * Verify JWT token from Supabase
 * 
 * Note: This is a simplified implementation that parses the JWT payload.
 * For production use, you should verify the token signature using Supabase's JWT secret.
 * 
 * A more secure approach would be to:
 * 1. Use Supabase's verifyJWT function or a JWT library
 * 2. Verify the token signature with Supabase's JWT secret
 * 3. Check expiration and other claims
 */
export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    // Extract the token (remove 'Bearer ' prefix if present)
    const cleanToken = token.replace(/^Bearer /, "");
    
    // Parse JWT (format: header.payload.signature)
    const parts = cleanToken.split(".");
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode payload (base64url decode)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    // Return user info from payload
    return {
      userId: payload.sub,
      email: payload.email || "",
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * Extract and verify JWT from Authorization header
 */
export async function getAuthenticatedUser(
  request: Request
): Promise<{ userId: string; email: string } | null> {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader) {
    return null;
  }
  
  return await verifyToken(authHeader);
}

