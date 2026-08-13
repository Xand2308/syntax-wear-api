import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter
});

const products = [
  {
    name: "Camiseta Oversized Preta",
    description: "Camiseta oversized preta em algodão premium",
    price: 89.90,
    stock: 25,
    image: "/uploads/camiseta-oversized-preta.jpg"
  },
  {
    name: "Camiseta Básica Branca",
    description: "Camiseta básica branca de algodão",
    price: 69.90,
    stock: 30,
    image: "/uploads/camiseta-basica-branca.jpg"
  },
  {
    name: "Calça Cargo Preta",
    description: "Calça cargo com modelagem moderna",
    price: 159.90,
    stock: 15,
    image: "/uploads/calca-cargo-preta.jpg"
  },
  {
    name: "Calça Jeans Azul",
    description: "Calça jeans azul de corte reto",
    price: 179.90,
    stock: 20,
    image: "/uploads/calca-jeans-azul.jpg"
  },
  {
    name: "Moletom Preto",
    description: "Moletom preto confortável para o dia a dia",
    price: 199.90,
    stock: 12,
    image: "/uploads/moletom-preto.jpg"
  },
  {
    name: "Moletom Cinza",
    description: "Moletom cinza com capuz",
    price: 189.90,
    stock: 18,
    image: "/uploads/moletom-cinza.jpg"
  },
  {
    name: "Jaqueta Jeans",
    description: "Jaqueta jeans clássica",
    price: 229.90,
    stock: 10,
    image: "/uploads/jaqueta-jeans.jpg"
  },
  {
    name: "Bermuda Cargo",
    description: "Bermuda cargo masculina",
    price: 119.90,
    stock: 22,
    image: "/uploads/bermuda-cargo.jpg"
  },
  {
    name: "Boné Preto",
    description: "Boné preto com design minimalista",
    price: 59.90,
    stock: 35,
    image: "/uploads/bone-preto.jpg"
  },
  {
    name: "Tênis Casual Branco",
    description: "Tênis casual branco para uso diário",
    price: 249.90,
    stock: 8,
    image: "/uploads/tenis-casual-branco.jpg"
  }
];

async function main() {
  await prisma.product.createMany({
    data: products
  });

  console.log("10 produtos criados com sucesso!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
