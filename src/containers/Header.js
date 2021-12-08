import { Navbar, Container } from 'react-bootstrap';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';

export default function Header() {
    return (
        <Navbar bg="dark" variant="dark">
            <Container>
                <Navbar.Brand href="/">Card Flipper</Navbar.Brand>
            </Container>
        </Navbar>
    )
}