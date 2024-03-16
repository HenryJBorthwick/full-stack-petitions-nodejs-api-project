// Define a TypeScript type for a User.
type User = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    image_filename: string | null;
    password: string; // Hashed password
    auth_token: string | null;
}