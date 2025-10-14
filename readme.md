# ShopBlizz Backend

ShopBlizz Backend is a Node.js REST API for an e-commerce web application, providing robust user, product, and order management. Built with Express, MongoDB, and AdminJS for secure and scalable operations.

## Features

- **User Management**: Registration, authentication (JWT), password change, avatar upload, and role-based access.
- **Product Management**: CRUD operations, image uploads (Cloudinary), category filtering, pagination, soft delete, and admin controls.
- **Order Management**: Order creation, status updates, cancellation, customer and admin views, and shipping method support.
- **Admin Panel**: Integrated AdminJS dashboard for managing users, products, and orders.
- **Scheduled Jobs**: Automated cleanup of soft-deleted products.
- **Validation**: Input validation using Zod schemas.
- **Security**: JWT authentication, secure cookies, and role-based authorization.

## Tech Stack

- Node.js
- Express
- MongoDB & Mongoose
- AdminJS
- Cloudinary
- Zod
- JWT
- Multer

## Getting Started

1. **Clone the repository**
2. **Install dependencies**

   ```sh
   npm install
```

Configure environment variables
Copy .env.sample to .env and fill in your credentials.
Run the development server
```Bash
npm run dev
```

## API Endpoints

- `/api/v1/users` – User registration, login, profile, avatar, password
- `/api/v1/products` – Product listing, details, admin CRUD, image upload
- `/api/v1/orders` – Order creation, status, customer/admin queries

## Admin Panel

Access the AdminJS dashboard at `/admin` for advanced management.

## License

ISC License

For more details, see the source code and documentation.
