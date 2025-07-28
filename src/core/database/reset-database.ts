import dataSource from './data-source';

const resetDatabase = async () => {
  try {
    // Initialize the data source
    const connection = await dataSource.initialize();
    console.log('Connected to database');

    // Drop all tables
    await connection.dropDatabase();
    console.log('Database dropped');

    // Run migrations
    await connection.runMigrations();
    console.log('Migrations executed');

    // Close the connection
    await connection.destroy();
    console.log('Connection closed');

    console.log('Database reset completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
resetDatabase();
