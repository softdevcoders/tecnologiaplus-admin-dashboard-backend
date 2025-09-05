import dataSource from '../data-source';
import { User } from '../../../modules/users/user.entity';
import { users } from './data/users';

export class UserSeeder {
  static async execute(): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const usersData = await users();

    const usersAlreadySeeded = await userRepository.find();

    if (usersAlreadySeeded.length > 0) {
      console.log('Users already seeded');
      return;
    }

    for (const userData of usersData) {
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
      }
    }
  }
}
