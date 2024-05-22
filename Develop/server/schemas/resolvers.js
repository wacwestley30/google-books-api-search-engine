const { User } = require('../models');
const { signToken, AuthenticationError } = require('../utils/auth');
const axios = require('axios');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id}).select('-__v -password');
        return userData;
      }
      throw AuthenticationError;
    },
    searchBooks: async (parent, { query }) => {
      try {
        // Make a GET request to the Google Books API
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
        // Extract the array of books from the API response
        const books = response.data.items.map(item => ({
          bookId: item.id,
          authors: item.volumeInfo.authors || [],
          description: item.volumeInfo.description || '',
          title: item.volumeInfo.title || '',
          image: item.volumeInfo.imageLinks?.thumbnail || '',
          link: item.volumeInfo.infoLink || ''
        }));
        /* console.log('this is books', books) */
        return books;
      } catch (error) {
        console.error('Error searching books:', error);
        throw new Error('Failed to search for books');
      }
    }
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw AuthenticationError;
      }

      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);
      return { token, user };
    },
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, { bookData }, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $addToSet: { savedBooks: bookData } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      }
      throw AuthenticationError;
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
        return updatedUser;
      }
      throw AuthenticationError;
    },
  },
};

module.exports = resolvers;