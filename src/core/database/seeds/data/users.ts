import { UserRole } from '../../../../modules/users/user.entity';
import * as bcrypt from 'bcrypt';

export const users = async () => [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Admin',
    email: 'admin@tecnologiaplus.com',
    password: await bcrypt.hash('password', 10),
    role: UserRole.ADMIN,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Editor Principal',
    email: 'editor@tecnologiaplus.com',
    password: await bcrypt.hash('password', 10),
    role: UserRole.EDITOR,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Editor',
    email: 'editor2@tecnologiaplus.com',
    password: await bcrypt.hash('password', 10),
    role: UserRole.EDITOR,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    name: 'Editor',
    email: 'editor3@tecnologiaplus.com',
    password: await bcrypt.hash('password', 10),
    role: UserRole.EDITOR,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    name: 'Editor',
    email: 'editor4@tecnologiaplus.com',
    password: await bcrypt.hash('password', 10),
    role: UserRole.EDITOR,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174005',
    name: 'Editor',
    email: 'editor5@tecnologiaplus.com',
    password: await bcrypt.hash('password', 10),
    role: UserRole.EDITOR,
  },
];
