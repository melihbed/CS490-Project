import {useState, useEffect} from 'react';
import axios from 'axios';
//import {Tables} from 'react-bootstrap';




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
            <div className="customer-table" style={{ marginTop: '20px' }}>
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Customer ID</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(customer => (
                            <tr key={customer.customer_id}>
                                <td>{customer.customer_id}</td>
                                <td>{customer.first_name}</td>
                                <td>{customer.last_name}</td>
                                <td>{customer.email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Customers;