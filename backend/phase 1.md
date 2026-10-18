For your very first step, the best resource to build a clean **CRUD (Create, Read, Update, Delete)** for is **Products** (`/api/products`), along with a simple **Health Check**.

Products are the ideal starting point because:
1. They don't require authentication or complex setup to get started.
2. The Next.js frontend can immediately fetch them to test Server Components and ISR.
3. They give you the `id` and `stock` fields you will later need for the Redis Cart and database row-locking.

---

### The Primary Endpoints for Step 1

| Operation | Method | Endpoint | Description | Sample Request / URL |
| :--- | :--- | :--- | :--- | :--- |
| **Ping** | `GET` | `/api/health` | Verify server status | `http://localhost:5000/api/health` |
| **Read (All)** | `GET` | `/api/products` | Get list of all products | `http://localhost:5000/api/products` |
| **Read (One)**| `GET` | `/api/products/:id` | Get single product by ID | `http://localhost:5000/api/products/1` |
| **Create** | `POST` | `/api/products` | Create a new product | Body: `{ title, price, stock, description }` |
| **Update** | `PUT` | `/api/products/:id` | Update product details or stock | Body: `{ price: 79.99, stock: 15 }` |
| **Delete** | `DELETE`| `/api/products/:id` | Remove a product | `http://localhost:5000/api/products/1` |

---

### Data Shape (Product Model)

```typescript
interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;         // Essential for later high-concurrency checkout locking
  description: string;
  imageUrl?: string;
  createdAt: string;
}
```

---

### How to Structure It in Express

To keep your code clean and scalable, divide it into 3 small files:

```text
backend/src/
├── controllers/
│   └── product.controller.ts   # Request/Response logic (req, res)
├── routes/
│   └── product.routes.ts       # Maps URLs to controllers
└── server.ts                   # Express app configuration & middleware
```

### Example Behavior for Testing

1. **`GET /api/products`**: Returns an array of products (starts with a few mock items).
2. **`POST /api/products`**: Accepts `{ title, price, stock, description }`, generates an `id`, and adds it to the list.
3. **`GET /api/products/:id`**: Finds and returns the product with the matching ID, or returns a `404 Not Found`.
4. **`PUT /api/products/:id`**: Updates the fields and returns the updated item.
5. **`DELETE /api/products/:id`**: Deletes the item and returns `204 No Content` or `{ success: true }`.

---

Would you like me to install the basic dependencies and set up these files in `backend/` so you can test them in your browser or Postman right away?