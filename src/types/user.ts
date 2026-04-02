export interface IUser {
  id: string;
  profilePictureUrl: string;
  fullname: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  lastOnline: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateUserInput {
  profilePictureUrl: string;
  fullname: string;
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface IUpdateUserInput {
  profilePictureUrl?: string;
  fullname?: string;
  username?: string;
  email?: string;
  role?: string;
  password?: string;
  isActive?: boolean;
}

// Settings for dynamic user roles
export interface IUserSettings {
  id: string;
  roles: string[];
}

export interface IUserSettingsResponse {
  userSettings: IUserSettings;
}

// Legacy support - map to new interface
export interface User {
  id: string;
  name: string;
  avatar: string;
  status: "Active" | "Inactive";
  email: string;
  role: "Admin" | "Copywriter";
  lastOnline: string;
  username?: string;
  password?: string;
}
