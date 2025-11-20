import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({})

async function main() {
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@rpms.com' },
    update: {},
    create: {
      email: 'doctor@rpms.com',
      name: 'Dr. Mutaician',
      role: 'DOCTOR',
    },
  })

  const patient = await prisma.user.upsert({
    where: { email: 'patient@rpms.com' },
    update: {},
    create: {
      email: 'patient@rpms.com',
      name: 'John Doe',
      role: 'PATIENT',
    },
  })

  console.log({ doctor, patient })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
