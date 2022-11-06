const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

function verifyIfAccountExistsCPF(req, res, next) {
	const { cpf } = req.headers;

	const customer = customers.find(customer => customer.cpf === cpf);

	if (!customer) {
		return res.json({ error: 'Customer not found!' });
	}

	req.customer = customer;

	return next();
}

app.post('/account', (req, res) => {
	const { cpf, name } = req.body;

	const customerAlreadyExists = customers.some(
		customer => customer.cpf === cpf
	);

	if (customerAlreadyExists) {
		return res.status(400).json({ error: 'Customer already exists!' });
	}

	customers.push({
		cpf,
		name,
		id: uuidv4(),
		statement: [],
	});

	return res.status(201).send();
});

app.get('/statement', verifyIfAccountExistsCPF, (req, res) => {
	const { customer } = req;

	res.json(customer.statement);
});

app.post('/deposit', verifyIfAccountExistsCPF, (req, res) => {
	const { description, amount } = req.body;

	const { customer } = req;

	const statementOperation = {
		description,
		amount,
		created_at: new Date(),
		type: 'credit',
	};

	customer.statement.push(statementOperation);

	return res.status(201).send();
});

app.listen(3333, () => console.log('Listening on localhost:3333'));
