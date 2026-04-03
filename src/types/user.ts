export interface IUser {
  id: string;
  namaLengkap: string;
  nip: string;
  email: string;
  noHp: string;
  pekerjaanSekarang?: string | null;
  divisi: "perencanaan_teknik" | "teknik_cabang" | "pengawasan_teknik";
  isActive: boolean;
}

export interface IUpdateUserInput {
  namaLengkap?: string;
  nip?: string;
  email?: string;
  noHp?: string;
  divisi?: "perencanaan_teknik" | "teknik_cabang" | "pengawasan_teknik";
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
// export interface User {
//   id: string;
//   name: string;
//   avatar: string;
//   status: "Active" | "Inactive";
//   email: string;
//   role: "Admin" | "Copywriter";
//   lastOnline: string;
//   username?: string;
//   password?: string;
// }
