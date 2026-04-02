export const GET_ARTICLES = `
  query GetArticles {
    articles {
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

export const GET_ARTICLE = `
  query GetArticle($id: ID!) {
    article(id: $id) {
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

export const GET_ARTICLE_BY_SLUG = `
  query GetArticleBySlug($slug: String!) {
    articleBySlug(slug: $slug) {
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

export const GET_PUBLISHED_ARTICLES = `
  query GetPublishedArticles {
    publishedArticles {
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
