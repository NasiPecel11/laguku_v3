const amqp = require("amqplib");

const ExportsService = {
  sendMessage: async (queue, msg) => {
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, {
      durable: true,
    });

    await channel.sendToQueue(queue, Buffer.from(msg));

    setTimeout(() => {
      connection.close();
    }, 1000);
  },
};

module.exports = ExportsService;
