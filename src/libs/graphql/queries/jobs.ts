export const JOBS = `
  query Jobs {
    jobs {
      id
      jobName { en id }
      department { en id }
      jobType
      locationType
      description { en id }
      applyUrl
      openingDate
      closingDate
      publish
      createdAt
      updatedAt
    }
  }
`;

export const JOB = `
  query Job($jobId: ID!) {
    job(id: $jobId) {
      id
      jobName { en id }
      department { en id }
      jobType
      locationType
      description { en id }
      applyUrl
      openingDate
      closingDate
      publish
      createdAt
      updatedAt
    }
  }
`;

export const PUBLISHED_JOBS = `
  query PublishedJobs {
    publishedJobs {
      id
      jobName { en id }
      department { en id }
      jobType
      locationType
      description { en id }
      applyUrl
      openingDate
      closingDate
      publish
      createdAt
      updatedAt
    }
  }
`;

export const JOB_SETTINGS = `
  query JobSettings {
    jobSettings {
      id
      jobTypes
      locationTypes
    }
  }
`;
