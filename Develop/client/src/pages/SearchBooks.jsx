import { useState, useEffect } from 'react';
import { Container, Col, Form, Button, Card, Row } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import { SEARCH_BOOKS, GET_ME } from '../utils/queries';
import { SAVE_BOOK } from '../utils/mutations';
import Auth from '../utils/auth';

const SearchBooks = () => {
  const [searchedBooks, setSearchedBooks] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [savedBookIds, setSavedBookIds] = useState([]);

  const { loading, data: userData, refetch: refetchUserData } = useQuery(GET_ME, {
    skip: !Auth.loggedIn(), // Only fetch if user is logged in
  });

  const [saveBook] = useMutation(SAVE_BOOK, {
    refetchQueries: [{ query: GET_ME }],
    onError(error) {
      console.error("Save book mutation error:", error);
    },
  });

  const { refetch: refetchSearchBooks } = useQuery(SEARCH_BOOKS, {
    variables: { query: searchInput },
    skip: true, // Skip automatic query execution
  });

  useEffect(() => {
    if (userData?.me?.savedBooks) {
      const savedBooks = userData.me.savedBooks.map((book) => book.bookId);
      setSavedBookIds(savedBooks);
    }
  }, [userData]);

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    try {
      const { data } = await refetchSearchBooks({ query: searchInput });
      
      if (data) {
        const bookData = data.searchBooks.map((book) => ({
          bookId: book.bookId,
          authors: book.authors || ['No author to display'],
          title: book.title,
          description: book.description,
          image: book.image || '',
          link: book.link || '#',
        }));

        setSearchedBooks(bookData);
      }
      setSearchInput('');
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleSaveBook = async (bookData) => {
    const token = Auth.getToken();

    if (!token) {
      return false;
    }

    try {
      await saveBook({
        variables: { bookData: { ...bookData, bookId: bookData.bookId } },
      });
      // Trigger refetch to get updated saved books
      refetchUserData();
      setSavedBookIds([...savedBookIds, bookData.bookId]);
    } catch (err) {
      console.error("Save book error:", err);
    }
  };

  return (
    <>
      <div className='text-light bg-dark p-5'>
        <Container>
          <label htmlFor='searchInput'>
            <h1>Search for Books!</h1>
          </label>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  id='searchInput'
                  name='searchInput'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type='text'
                  size='lg'
                  placeholder='Search for a book'
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type='submit' variant='success' size='lg'>
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className='pt-5'>
          {searchedBooks.length ? `Viewing ${searchedBooks.length} results:` : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => (
            <Col md='4' key={book.bookId}>
              <Card border='dark'>
                {book.image ? (
                  <a href={book.link} target="_blank" rel="noopener noreferrer">
                    <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' />
                  </a>
                ) : null}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className='small'>Authors: {book.authors.join(', ')}</p>
                  <Card.Text>{book.description}</Card.Text>
                  {Auth.loggedIn() && (
                    <Button
                      disabled={savedBookIds?.some((savedBookId) => savedBookId === book.bookId)}
                      className='btn-block btn-info'
                      onClick={() => handleSaveBook(book)}
                    >
                      {savedBookIds?.some((savedBookId) => savedBookId === book.bookId)
                        ? 'This book has already been saved!'
                        : 'Save this Book!'}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SearchBooks;