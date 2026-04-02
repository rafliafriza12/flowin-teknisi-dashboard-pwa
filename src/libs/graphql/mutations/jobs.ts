export const CREATE_JOB = `
  mutation CreateJob($input: CreateJobsInput!) {
    createJob(input: $input) {
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

export const UPDATE_JOB = `
  mutation UpdateJob($updateJobId: ID!, $input: UpdateJobsInput!) {
    updateJob(id: $updateJobId, input: $input) {
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

export const DELETE_JOB = `
  mutation DeleteJob($deleteJobId: ID!) {
    deleteJob(id: $deleteJobId)
  }
`;

export const ADD_JOB_TYPE = `
  mutation AddJobType($jobType: String!) {
    addJobType(jobType: $jobType) {
      id
      jobTypes
      locationTypes
    }
  }
`;

export const REMOVE_JOB_TYPE = `
  mutation RemoveJobType($jobType: String!) {
    removeJobType(jobType: $jobType) {
      id
      jobTypes
      locationTypes
    }
  }
`;

export const ADD_LOCATION_TYPE = `
  mutation AddLocationType($locationType: String!) {
    addLocationType(locationType: $locationType) {
      id
      jobTypes
      locationTypes
    }
  }
`;

export const REMOVE_LOCATION_TYPE = `
  mutation RemoveLocationType($locationType: String!) {
    removeLocationType(locationType: $locationType) {
      id
      jobTypes
      locationTypes
    }
  }
`;

export const UPDATE_JOB_TYPE = `
  mutation UpdateJobType($oldJobType: String!, $newJobType: String!) {
    updateJobType(oldJobType: $oldJobType, newJobType: $newJobType) {
      settings {
        id
        jobTypes
        locationTypes
      }
      affectedCount
    }
  }
`;

export const DELETE_JOB_TYPE_WITH_CASCADE = `
  mutation DeleteJobTypeWithCascade($jobType: String!) {
    deleteJobTypeWithCascade(jobType: $jobType) {
      settings {
        id
        jobTypes
        locationTypes
      }
      affectedCount
    }
  }
`;

export const UPDATE_LOCATION_TYPE = `
  mutation UpdateLocationType($oldLocationType: String!, $newLocationType: String!) {
    updateLocationType(oldLocationType: $oldLocationType, newLocationType: $newLocationType) {
      settings {
        id
        jobTypes
        locationTypes
      }
      affectedCount
    }
  }
`;

export const DELETE_LOCATION_TYPE_WITH_CASCADE = `
  mutation DeleteLocationTypeWithCascade($locationType: String!) {
    deleteLocationTypeWithCascade(locationType: $locationType) {
      settings {
        id
        jobTypes
        locationTypes
      }
      affectedCount
    }
  }
`;
