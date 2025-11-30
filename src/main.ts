import "reflect-metadata";

/**
 * Example bootstrap - Create your own AppModule
 */
async function bootstrap() {
  // TODO: Create your AppModule and use it here
  // const app = await RestFactory.create(AppModule);
  // app.setGlobalPrefix("/api");
  // await app.listen(3000);

  console.log("RestJS Framework - Ready to use!");
  console.log("Create your AppModule and uncomment the code above.");
}

bootstrap().catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
