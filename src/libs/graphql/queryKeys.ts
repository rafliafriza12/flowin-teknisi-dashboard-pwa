export const queryKeys = {
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.users.lists(), filters]
        : queryKeys.users.lists(),
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.users.details(), id] as const,
    byRole: (role: string) => [...queryKeys.users.all, "byRole", role] as const,
  },
  roles: {
    all: ["roles"] as const,
    lists: () => [...queryKeys.roles.all, "list"] as const,
    list: () => queryKeys.roles.lists(),
    details: () => [...queryKeys.roles.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.roles.details(), id] as const,
    byName: (name: string) => [...queryKeys.roles.all, "byName", name] as const,
  },
  homePage: {
    all: ["homePage"] as const,
    lists: () => [...queryKeys.homePage.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.homePage.lists(), filters]
        : queryKeys.homePage.lists(),
    details: () => [...queryKeys.homePage.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.homePage.details(), id] as const,
  },
  aboutUsPage: {
    all: ["aboutUsPage"] as const,
    lists: () => [...queryKeys.aboutUsPage.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.aboutUsPage.lists(), filters]
        : queryKeys.aboutUsPage.lists(),
    details: () => [...queryKeys.aboutUsPage.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.aboutUsPage.details(), id] as const,
  },
  investorRelationPage: {
    all: ["investorRelationPage"] as const,
    lists: () => [...queryKeys.investorRelationPage.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.investorRelationPage.lists(), filters]
        : queryKeys.investorRelationPage.lists(),
    details: () => [...queryKeys.investorRelationPage.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.investorRelationPage.details(), id] as const,
  },
  mediaPage: {
    all: ["mediaPage"] as const,
    lists: () => [...queryKeys.mediaPage.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.mediaPage.lists(), filters]
        : queryKeys.mediaPage.lists(),
    details: () => [...queryKeys.mediaPage.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.mediaPage.details(), id] as const,
  },
  governancePage: {
    all: ["governancePage"] as const,
    lists: () => [...queryKeys.governancePage.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.governancePage.lists(), filters]
        : queryKeys.governancePage.lists(),
    details: () => [...queryKeys.governancePage.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.governancePage.details(), id] as const,
  },
  careerPage: {
    all: ["careerPage"] as const,
    lists: () => [...queryKeys.careerPage.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.careerPage.lists(), filters]
        : queryKeys.careerPage.lists(),
    details: () => [...queryKeys.careerPage.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.careerPage.details(), id] as const,
  },
  sustainabilityPage: {
    all: ["sustainabilityPage"] as const,
    lists: () => [...queryKeys.sustainabilityPage.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.sustainabilityPage.lists(), filters]
        : queryKeys.sustainabilityPage.lists(),
    details: () => [...queryKeys.sustainabilityPage.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.sustainabilityPage.details(), id] as const,
  },
  businessOperationPage: {
    all: ["businessOperationPage"] as const,
    lists: () => [...queryKeys.businessOperationPage.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.businessOperationPage.lists(), filters]
        : queryKeys.businessOperationPage.lists(),
    details: () => [...queryKeys.businessOperationPage.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.businessOperationPage.details(), id] as const,
  },
  annualReports: {
    all: ["annualReports"] as const,
    lists: () => [...queryKeys.annualReports.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.annualReports.lists(), filters]
        : queryKeys.annualReports.lists(),
    details: () => [...queryKeys.annualReports.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.annualReports.details(), id] as const,
    published: () => [...queryKeys.annualReports.all, "published"] as const,
  },
  creditAndAnalystReports: {
    all: ["creditAndAnalystReports"] as const,
    lists: () => [...queryKeys.creditAndAnalystReports.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.creditAndAnalystReports.lists(), filters]
        : queryKeys.creditAndAnalystReports.lists(),
    details: () =>
      [...queryKeys.creditAndAnalystReports.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.creditAndAnalystReports.details(), id] as const,
    published: () =>
      [...queryKeys.creditAndAnalystReports.all, "published"] as const,
  },
  financialStatements: {
    all: ["financialStatements"] as const,
    lists: () => [...queryKeys.financialStatements.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.financialStatements.lists(), filters]
        : queryKeys.financialStatements.lists(),
    details: () => [...queryKeys.financialStatements.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.financialStatements.details(), id] as const,
    published: () =>
      [...queryKeys.financialStatements.all, "published"] as const,
  },
  sustainabilityReports: {
    all: ["sustainabilityReports"] as const,
    lists: () => [...queryKeys.sustainabilityReports.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.sustainabilityReports.lists(), filters]
        : queryKeys.sustainabilityReports.lists(),
    details: () => [...queryKeys.sustainabilityReports.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.sustainabilityReports.details(), id] as const,
    published: () =>
      [...queryKeys.sustainabilityReports.all, "published"] as const,
  },
  articles: {
    all: ["articles"] as const,
    lists: () => [...queryKeys.articles.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.articles.lists(), filters]
        : queryKeys.articles.lists(),
    details: () => [...queryKeys.articles.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.articles.details(), id] as const,
    bySlug: (slug: string) =>
      [...queryKeys.articles.all, "bySlug", slug] as const,
    published: () => [...queryKeys.articles.all, "published"] as const,
  },
  pressReleaseMedias: {
    all: ["pressReleaseMedias"] as const,
    lists: () => [...queryKeys.pressReleaseMedias.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.pressReleaseMedias.lists(), filters]
        : queryKeys.pressReleaseMedias.lists(),
    details: () => [...queryKeys.pressReleaseMedias.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.pressReleaseMedias.details(), id] as const,
    published: () =>
      [...queryKeys.pressReleaseMedias.all, "published"] as const,
  },
  galleries: {
    all: ["galleries"] as const,
    lists: () => [...queryKeys.galleries.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.galleries.lists(), filters]
        : queryKeys.galleries.lists(),
    details: () => [...queryKeys.galleries.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.galleries.details(), id] as const,
    published: () => [...queryKeys.galleries.all, "published"] as const,
  },
  corporateActions: {
    all: ["corporateActions"] as const,
    lists: () => [...queryKeys.corporateActions.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.corporateActions.lists(), filters]
        : queryKeys.corporateActions.lists(),
    details: () => [...queryKeys.corporateActions.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.corporateActions.details(), id] as const,
    published: () => [...queryKeys.corporateActions.all, "published"] as const,
  },
  disclosures: {
    all: ["disclosures"] as const,
    lists: () => [...queryKeys.disclosures.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.disclosures.lists(), filters]
        : queryKeys.disclosures.lists(),
    details: () => [...queryKeys.disclosures.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.disclosures.details(), id] as const,
    published: () => [...queryKeys.disclosures.all, "published"] as const,
  },
  gmsAndEvents: {
    all: ["gmsAndEvents"] as const,
    lists: () => [...queryKeys.gmsAndEvents.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.gmsAndEvents.lists(), filters]
        : queryKeys.gmsAndEvents.lists(),
    details: () => [...queryKeys.gmsAndEvents.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.gmsAndEvents.details(), id] as const,
    published: () => [...queryKeys.gmsAndEvents.all, "published"] as const,
  },
  presentationAndInsights: {
    all: ["presentationAndInsights"] as const,
    lists: () => [...queryKeys.presentationAndInsights.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.presentationAndInsights.lists(), filters]
        : queryKeys.presentationAndInsights.lists(),
    details: () =>
      [...queryKeys.presentationAndInsights.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.presentationAndInsights.details(), id] as const,
    published: () =>
      [...queryKeys.presentationAndInsights.all, "published"] as const,
  },
  supportingDocuments: {
    all: ["supportingDocuments"] as const,
    lists: () => [...queryKeys.supportingDocuments.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.supportingDocuments.lists(), filters]
        : queryKeys.supportingDocuments.lists(),
    details: () => [...queryKeys.supportingDocuments.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.supportingDocuments.details(), id] as const,
    published: () =>
      [...queryKeys.supportingDocuments.all, "published"] as const,
  },
  jobs: {
    all: ["jobs"] as const,
    lists: () => [...queryKeys.jobs.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.jobs.lists(), filters]
        : queryKeys.jobs.lists(),
    details: () => [...queryKeys.jobs.all, "detail"] as const,
    detail: (id: string | number) => [...queryKeys.jobs.details(), id] as const,
    published: () => [...queryKeys.jobs.all, "published"] as const,
    settings: () => [...queryKeys.jobs.all, "settings"] as const,
  },
  settings: {
    all: ["settings"] as const,
    data: () => [...queryKeys.settings.all, "data"] as const,
  },
  workOrders: {
    all: ["workOrders"] as const,
    lists: () => [...queryKeys.workOrders.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.workOrders.lists(), filters]
        : queryKeys.workOrders.lists(),
    saya: () => [...queryKeys.workOrders.all, "saya"] as const,
    sayaFiltered: (filters?: Record<string, unknown>) =>
      filters && Object.keys(filters).length > 0
        ? [...queryKeys.workOrders.saya(), filters]
        : queryKeys.workOrders.saya(),
    details: () => [...queryKeys.workOrders.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.workOrders.details(), id] as const,
    byKoneksiData: (idKoneksiData: string) =>
      [...queryKeys.workOrders.all, "byKoneksiData", idKoneksiData] as const,
    workflowChain: (idKoneksiData: string) =>
      [...queryKeys.workOrders.all, "workflowChain", idKoneksiData] as const,
  },
} as const;
