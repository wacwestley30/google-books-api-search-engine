import { useState, useEffect } from 'react';
import { Container, Col, Form, Button, Card, Row } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import { SEARCH_BOOKS, GET_ME } from '../utils/queries';
import { SAVE_BOOK } from '../utils/mutations';
import Auth from '../utils/auth';

const SearchBooks = () => {
  // create state for holding returned google api data
  const [searchedBooks, setSearchedBooks] = useState([]);
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState('');
  // create state to hold saved bookId values
  const [savedBookIds, setSavedBookIds] = useState([]);

  const { loading, error, data, refetch } = useQuery(SEARCH_BOOKS, {
    variables: { query: searchInput },
    skip: true, // Do not run the query automatically
  });
  
  const [saveBook] = useMutation(SAVE_BOOK, {
    update(cache, { data: { saveBook } }) {
      const { me } = cache.readQuery({ query: GET_ME });
      cache.writeQuery({
        query: GET_ME,
        data: { me: { ...me, savedBooks: [...me.savedBooks, saveBook] } },
      });
    },
  });

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    try {
      const { data } = await refetch({ query: searchInput });
      // console.log('This is the repsonse:', data);

      const bookData = data.searchBooks.map((book) => ({
        bookId: book.bookId,
        authors: book.authors || ['No author to display'],
        title: book.title,
        description: book.description,
        image: book.image || '',
      }));

      setSearchedBooks(bookData);
      setSearchInput('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveBook = async (bookData) => {
    const token = Auth.getToken();
    try {
      await saveBook({
        variables: { bookData: { ...bookData, bookId: bookData.bookId } },
      });
      setSavedBookIds([...savedBookIds, bookData.bookId]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (data) {
      const bookData = data.searchBooks.map((book) => ({
        bookId: book.bookId,
        authors: book.authors || ['No author to display'],
        title: book.title,
        description: book.description,
        image: book.image || '',
      }));
      setSearchedBooks(bookData);
    }
  }, [data]);

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name="searchInput"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type="text"
                  size="lg"
                  placeholder="Search for a book"
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type="submit" variant="success" size="lg">
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className="pt-5">
          {searchedBooks.length ? `Viewing ${searchedBooks.length} results:` : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => (
            <Col md="4" key={book.bookId}>
              <Card border="dark">
                {book.image ? (
                  <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' />
                ) : null}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className='small'>Authors: {book.authors.join(', ')}</p>
                  <Card.Text>{book.description}</Card.Text>
                  {Auth.loggedIn() && (
                    <Button
                      disabled={savedBookIds?.some((savedBookId) => savedBookId === book.bookId)}
                      className='btn-block btn-info'
                      onClick={() => handleSaveBook(book)}>
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