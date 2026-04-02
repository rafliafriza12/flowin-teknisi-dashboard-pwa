// Auth Mutations

// Login - Public (tanpa token)
export const LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        profilePictureUrl
        fullname
        username
        email
        isActive
        lastOnline
        createdAt
        updatedAt
      }
      tokens {
        accessToken
        refreshToken
      }
    }
  }
`;

// Register - Public (tanpa token)
export const REGISTER = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        profilePictureUrl
        fullname
        username
        email
        isActive
        lastOnline
        createdAt
        updatedAt
      }
      tokens {
        accessToken
        refreshToken
      }
    }
  }
`;

// Logout - Protected (butuh token)
export const LOGOUT = `
  mutation Logout {
    logout {
      success
      message
    }
  }
`;

// Refresh Token - Public (tanpa token)
export const REFRESH_TOKEN = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

// Change Password - Protected (butuh token)
export const CHANGE_PASSWORD = `
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
    }
  }
`;

// Forgot Password - Public (tanpa token)
export const FORGOT_PASSWORD = `
  mutation ForgotPassword($input: ForgotPasswordInput!) {
    forgotPassword(input: $input) {
      success
      message
    }
  }
`;

// Reset Password - Public (tanpa token)
export const RESET_PASSWORD = `
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      success
      message
    }
  }
`;
