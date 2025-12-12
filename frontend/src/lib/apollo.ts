import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: `${import.meta.env.VITE_STRAPI_API_URL}/graphql` || 'http://localhost:1337/graphql',
});

const authLink = setContext(async (_, { headers }) => {
  // TODO: Retrieve token from auth provider (Firebase or Strapi)
  // For now, we assume public access or token will be added later
  const token = localStorage.getItem('strapi_jwt');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
