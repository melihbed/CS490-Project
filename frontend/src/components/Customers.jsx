import {useState, useEffect} from 'react';
import axios from 'axios';
import {Table} from 'react-bootstrap';




function Customers() {
    const [customers, setCustomers] = useState([]);




    useEffect(() => {
        axios.get('http://localhost:5000/customers')
            .then(response => {
                console.log(response.data);
                setCustomers(response.data);
            })
            .catch(error => {
                console.error('Error fetching customers:', error);
            });
    }, []);







    return (
        <div>
            <h1>Welcome to the Customers Page!</h1>
            <div className="search-bar">
                <input type="text" placeholder="Search for customers by ID, Firstname or LastName" />
                <button>Search</button>
            </div>
            
            
            <div className="customer-table" style={{ marginTop: '20px' }}>
                <Table striped bordered='true' hover>
                    <thead>
                        <tr>
                            <th>Customer ID</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Address</th>
                            <th>City</th>
                            <th>Country</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(customer => (
                            <tr key={customer.customer_id}>
                                <td>{customer.customer_id}</td>
                                <td>{customer.first_name}</td>
                                <td>{customer.last_name}</td>
                                <td>{customer.email}</td>
                                <td>{customer.address}</td>
                                <td>{customer.city}</td>
                                <td>{customer.country}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}

export default Customers;