export const CREATE_ARTICLE = `
  mutation CreateArticle($input: CreateArticle!) {
    createArticle(input: $input) {
      id
      title { en id }
      slug
      description { en id }
      content { en id }
      coverImageUrl
      imageAlt { en id }
      status
      publishedAt
      authorId {
        id
        fullname
        email
        profilePictureUrl
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ARTICLE = `
  mutation UpdateArticle($id: ID!, $input: UpdateArticle!) {
    updateArticle(id: $id, input: $input) {
      id
      title { en id }
      slug
      description { en id }
      content { en id }
      coverImageUrl
      imageAlt { en id }
      status
      publishedAt
      authorId {
        id
        fullname
        email
        profilePictureUrl
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_ARTICLE = `
  mutation DeleteArticle($id: ID!) {
    deleteArticle(id: $id)
  }
`;
