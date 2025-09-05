const fs = require('fs').promises;
const path = require('path');
const { getDataFilePath } = require('../config/db');

// Sample book data for seeding
const books = [
  {
    id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    description: 'The story of young Scout Finch, her brother Jem, and their father Atticus, a lawyer defending a Black man accused of rape in a racist Southern town.',
    coverImage: 'https://example.com/covers/to-kill-a-mockingbird.jpg',
    genres: ['Fiction', 'Classic', 'Coming-of-Age'],
    publishedYear: 1960,
    averageRating: 4.8,
    reviewCount: 42
  },
  {
    id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    title: '1984',
    author: 'George Orwell',
    description: 'A dystopian novel about a totalitarian regime that controls information and surveils its citizens, following Winston Smith as he rebels against the system.',
    coverImage: 'https://example.com/covers/1984.jpg',
    genres: ['Fiction', 'Dystopian', 'Classic', 'Science Fiction'],
    publishedYear: 1949,
    averageRating: 4.6,
    reviewCount: 38
  },
  {
    id: '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    description: 'The story follows the main character Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage.',
    coverImage: 'https://example.com/covers/pride-and-prejudice.jpg',
    genres: ['Fiction', 'Romance', 'Classic'],
    publishedYear: 1813,
    averageRating: 4.5,
    reviewCount: 35
  },
  {
    id: '4a3d9aaa-608c-49a7-ae4c-9a7b4b1c3d4f',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    description: 'Set in the Jazz Age, it tells the story of the mysterious millionaire Jay Gatsby and his obsession with the beautiful Daisy Buchanan.',
    coverImage: 'https://example.com/covers/the-great-gatsby.jpg',
    genres: ['Fiction', 'Classic', 'Literary Fiction'],
    publishedYear: 1925,
    averageRating: 4.3,
    reviewCount: 29
  },
  {
    id: '5f5d9a9e-3c8c-4f5f-9e6c-1d8c6b7a8c9b',
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    description: 'The story of teenage Holden Caulfield, expelled from his prep school, as he wanders through New York City processing his disillusionment with the adult world.',
    coverImage: 'https://example.com/covers/catcher-in-the-rye.jpg',
    genres: ['Fiction', 'Coming-of-Age', 'Classic'],
    publishedYear: 1951,
    averageRating: 4.2,
    reviewCount: 27
  },
  {
    id: '8c7a5f4d-9c8d-4f6e-9e7b-7c8a9b0a1c2d',
    title: 'Harry Potter and the Philosopher\'s Stone',
    author: 'J.K. Rowling',
    description: 'The story of a young wizard, Harry Potter, who discovers his magical heritage and attends Hogwarts School of Witchcraft and Wizardry.',
    coverImage: 'https://example.com/covers/harry-potter-1.jpg',
    genres: ['Fantasy', 'Young Adult', 'Magic'],
    publishedYear: 1997,
    averageRating: 4.7,
    reviewCount: 56
  },
  {
    id: '3e4f5c6d-7b8a-9c0d-1e2f-3a4b5c6d7e8f',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    description: 'The journey of home-loving Bilbo Baggins, who is convinced by the wizard Gandalf to join a group of dwarves on a quest to reclaim their mountain home.',
    coverImage: 'https://example.com/covers/the-hobbit.jpg',
    genres: ['Fantasy', 'Adventure', 'Classic'],
    publishedYear: 1937,
    averageRating: 4.7,
    reviewCount: 48
  },
  {
    id: '2f3e4d5c-6b7a-8c9d-0e1f-2a3b4c5d6e7f',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    description: 'A fable about following your dreams and listening to your heart, following a young Andalusian shepherd on his journey to find treasure.',
    coverImage: 'https://example.com/covers/the-alchemist.jpg',
    genres: ['Fiction', 'Fantasy', 'Philosophy', 'Adventure'],
    publishedYear: 1988,
    averageRating: 4.4,
    reviewCount: 37
  },
  {
    id: '1d2e3f4a-5b6c-7d8e-9f0a-1b2c3d4e5f6a',
    title: 'Dune',
    author: 'Frank Herbert',
    description: 'Set on the desert planet Arrakis, it tells the story of Paul Atreides as his family accepts the stewardship of the planet and its valuable spice melange.',
    coverImage: 'https://example.com/covers/dune.jpg',
    genres: ['Science Fiction', 'Space Opera', 'Adventure'],
    publishedYear: 1965,
    averageRating: 4.6,
    reviewCount: 41
  },
  {
    id: '0c1d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f',
    title: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    description: 'The saga of a group of heroes who set out to save their world from the dark lord Sauron by destroying a powerful and evil ring.',
    coverImage: 'https://example.com/covers/lotr.jpg',
    genres: ['Fantasy', 'Epic', 'Adventure', 'Classic'],
    publishedYear: 1954,
    averageRating: 4.9,
    reviewCount: 63
  },
  {
    id: '9b8c7d6e-5f4a-3b2c-1d0e-9f8a7b6c5d4e',
    title: 'Brave New World',
    author: 'Aldous Huxley',
    description: 'A dystopian novel set in a futuristic World State where citizens are environmentally engineered into a rigid social hierarchy.',
    coverImage: 'https://example.com/covers/brave-new-world.jpg',
    genres: ['Science Fiction', 'Dystopian', 'Classic'],
    publishedYear: 1932,
    averageRating: 4.3,
    reviewCount: 31
  },
  {
    id: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d',
    title: 'The Hunger Games',
    author: 'Suzanne Collins',
    description: 'In a dystopian future, the nation of Panem forces children to fight to the death in an annual televised event called the Hunger Games.',
    coverImage: 'https://example.com/covers/hunger-games.jpg',
    genres: ['Young Adult', 'Dystopian', 'Science Fiction', 'Adventure'],
    publishedYear: 2008,
    averageRating: 4.5,
    reviewCount: 45
  },
  {
    id: '7f6e5d4c-3b2a-1f0e-9d8c-7b6a5f4e3d2c',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    description: 'A survey of the history of humankind from the evolution of archaic human species in the Stone Age up to the present day.',
    coverImage: 'https://example.com/covers/sapiens.jpg',
    genres: ['Non-Fiction', 'History', 'Science', 'Anthropology'],
    publishedYear: 2011,
    averageRating: 4.7,
    reviewCount: 39
  },
  {
    id: '6d5e4f3a-2b1c-0d9e-8f7a-6b5c4d3e2f1a',
    title: 'The Kite Runner',
    author: 'Khaled Hosseini',
    description: 'The story of Amir, a young boy from Kabul, and his journey of redemption following a childhood incident that destroyed his friendship with Hassan.',
    coverImage: 'https://example.com/covers/kite-runner.jpg',
    genres: ['Fiction', 'Historical Fiction', 'Drama'],
    publishedYear: 2003,
    averageRating: 4.6,
    reviewCount: 36
  },
  {
    id: '5c4d3e2f-1a0b-9d8e-7f6a-5b4c3d2e1f0a',
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    description: 'A novel that explores the mental anguish and moral dilemmas of Rodion Raskolnikov, an impoverished ex-student in Saint Petersburg who murders a pawnbroker for her money.',
    coverImage: 'https://example.com/covers/crime-and-punishment.jpg',
    genres: ['Fiction', 'Classic', 'Psychological', 'Philosophy'],
    publishedYear: 1866,
    averageRating: 4.4,
    reviewCount: 32
  },
  {
    id: 'a1e2b3c4-d5f6-4e7a-8b9c-0d1e2f3a4b5c',
    title: 'The Book Thief',
    author: 'Markus Zusak',
    description: 'A young girl living with her adoptive German family during the Nazi era steals books and shares them with her neighbors and the Jewish man hiding in her basement.',
    coverImage: 'https://covers.openlibrary.org/b/id/8228691-L.jpg',
    genres: ['Historical Fiction', 'Young Adult', 'War'],
    publishedYear: 2005,
    averageRating: 4.5,
    reviewCount: 30
  },
  {
    id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    title: 'The Road',
    author: 'Cormac McCarthy',
    description: 'A father and son journey through a post-apocalyptic America, struggling to survive and retain their humanity.',
    coverImage: 'https://covers.openlibrary.org/b/id/240726-L.jpg',
    genres: ['Fiction', 'Post-Apocalyptic', 'Adventure'],
    publishedYear: 2006,
    averageRating: 4.2,
    reviewCount: 22
  },
  {
    id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    title: 'The Girl with the Dragon Tattoo',
    author: 'Stieg Larsson',
    description: 'A journalist and a computer hacker team up to solve a decades-old disappearance in Sweden.',
    coverImage: 'https://covers.openlibrary.org/b/id/8231856-L.jpg',
    genres: ['Mystery', 'Thriller', 'Crime'],
    publishedYear: 2005,
    averageRating: 4.3,
    reviewCount: 28
  },
  {
    id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    title: 'Life of Pi',
    author: 'Yann Martel',
    description: 'A young boy survives a shipwreck and is stranded on a lifeboat with a Bengal tiger.',
    coverImage: 'https://covers.openlibrary.org/b/id/240727-L.jpg',
    genres: ['Fiction', 'Adventure', 'Philosophy'],
    publishedYear: 2001,
    averageRating: 4.1,
    reviewCount: 21
  },
  {
    id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    title: 'Gone Girl',
    author: 'Gillian Flynn',
    description: 'A psychological thriller about a marriage gone terribly wrong, told from alternating perspectives.',
    coverImage: 'https://covers.openlibrary.org/b/id/8231996-L.jpg',
    genres: ['Thriller', 'Mystery', 'Crime'],
    publishedYear: 2012,
    averageRating: 4.0,
    reviewCount: 25
  },
  {
    id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    title: 'The Fault in Our Stars',
    author: 'John Green',
    description: 'Two teenagers with cancer meet at a support group and fall in love, exploring life and mortality together.',
    coverImage: 'https://covers.openlibrary.org/b/id/7269256-L.jpg',
    genres: ['Young Adult', 'Romance', 'Drama'],
    publishedYear: 2012,
    averageRating: 4.4,
    reviewCount: 33
  },
  {
    id: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    title: 'Educated',
    author: 'Tara Westover',
    description: 'A memoir about a woman who grows up in a strict and abusive household in rural Idaho but eventually escapes to learn about the wider world through education.',
    coverImage: 'https://covers.openlibrary.org/b/id/8937646-L.jpg',
    genres: ['Memoir', 'Non-Fiction', 'Biography'],
    publishedYear: 2018,
    averageRating: 4.5,
    reviewCount: 27
  },
  {
    id: 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    description: 'A psychological thriller about a woman who shoots her husband and then stops speaking, and the psychotherapist determined to get her to talk.',
    coverImage: 'https://covers.openlibrary.org/b/id/10045138-L.jpg',
    genres: ['Thriller', 'Mystery', 'Psychological'],
    publishedYear: 2019,
    averageRating: 4.1,
    reviewCount: 19
  },
  {
    id: 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
    title: 'Normal People',
    author: 'Sally Rooney',
    description: 'The complex relationship between two Irish teenagers as they navigate adulthood, love, and social class.',
    coverImage: 'https://covers.openlibrary.org/b/id/10531938-L.jpg',
    genres: ['Fiction', 'Romance', 'Contemporary'],
    publishedYear: 2018,
    averageRating: 4.0,
    reviewCount: 18
  },
  {
    id: 'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a',
    title: 'Where the Crawdads Sing',
    author: 'Delia Owens',
    description: "A coming-of-age murder mystery set in the marshes of North Carolina, following the life of Kya Clark, the 'Marsh Girl'.",
    coverImage: 'https://covers.openlibrary.org/b/id/9255896-L.jpg',
    genres: ['Fiction', 'Mystery', 'Coming-of-Age'],
    publishedYear: 2018,
    averageRating: 4.3,
    reviewCount: 24
  },
  {
    id: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
    title: 'A Man Called Ove',
    author: 'Fredrik Backman',
    description: 'A grumpy yet loveable man finds his solitary world turned on its head when a boisterous young family moves in next door.',
    coverImage: 'https://covers.openlibrary.org/b/id/8231997-L.jpg',
    genres: ['Fiction', 'Contemporary', 'Humor'],
    publishedYear: 2012,
    averageRating: 4.2,
    reviewCount: 20
  },
  {
    id: 'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c',
    title: 'The Goldfinch',
    author: 'Donna Tartt',
    description: 'A young boy in New York City is taken in by a wealthy family after his mother is killed in a bombing at the Metropolitan Museum of Art.',
    coverImage: 'https://covers.openlibrary.org/b/id/8231998-L.jpg',
    genres: ['Fiction', 'Literary Fiction', 'Drama'],
    publishedYear: 2013,
    averageRating: 4.0,
    reviewCount: 18
  },
  {
    id: 'a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d',
    title: 'The Night Circus',
    author: 'Erin Morgenstern',
    description: 'A magical competition between two young illusionists leads to love and consequences in a mysterious circus that only appears at night.',
    coverImage: 'https://covers.openlibrary.org/b/id/7269257-L.jpg',
    genres: ['Fantasy', 'Romance', 'Historical Fiction'],
    publishedYear: 2011,
    averageRating: 4.1,
    reviewCount: 17
  },
  {
    id: 'b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e',
    title: 'The Shadow of the Wind',
    author: 'Carlos Ruiz Zafón',
    description: 'A young boy in post-Spanish Civil War Barcelona discovers a mysterious book that changes his life forever.',
    coverImage: 'https://covers.openlibrary.org/b/id/8228692-L.jpg',
    genres: ['Mystery', 'Historical Fiction', 'Literary Fiction'],
    publishedYear: 2001,
    averageRating: 4.3,
    reviewCount: 19
  },
  {
    id: 'c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f',
    title: 'The Martian',
    author: 'Andy Weir',
    description: 'An astronaut becomes stranded on Mars and must use his ingenuity to survive until rescue.',
    coverImage: 'https://covers.openlibrary.org/b/id/8228693-L.jpg',
    genres: ['Science Fiction', 'Adventure', 'Thriller'],
    publishedYear: 2014,
    averageRating: 4.6,
    reviewCount: 23
  },
  {
    id: 'd6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a',
    title: 'The Light Between Oceans',
    author: 'M.L. Stedman',
    description: 'A lighthouse keeper and his wife make a devastating decision that forever changes two worlds.',
    coverImage: 'https://covers.openlibrary.org/b/id/8228694-L.jpg',
    genres: ['Historical Fiction', 'Drama', 'Romance'],
    publishedYear: 2012,
    averageRating: 4.0,
    reviewCount: 15
  },
  {
    id: 'e7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b',
    title: 'The Immortal Life of Henrietta Lacks',
    author: 'Rebecca Skloot',
    description: 'The story of the woman whose cancer cells were harvested without her knowledge, leading to countless medical breakthroughs.',
    coverImage: 'https://covers.openlibrary.org/b/id/8228695-L.jpg',
    genres: ['Non-Fiction', 'Biography', 'Science'],
    publishedYear: 2010,
    averageRating: 4.5,
    reviewCount: 22
  },
  {
    id: 'f8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c',
    title: 'The Secret History',
    author: 'Donna Tartt',
    description: 'A group of classics students at an elite college become entwined in a murder, exploring the consequences of their actions.',
    coverImage: 'https://covers.openlibrary.org/b/id/8228696-L.jpg',
    genres: ['Fiction', 'Mystery', 'Psychological'],
    publishedYear: 1992,
    averageRating: 4.2,
    reviewCount: 21
  },
  {
    id: 'a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d',
    title: 'Never Let Me Go',
    author: 'Kazuo Ishiguro',
    description: 'A haunting story of love, loss, and hidden truths at a mysterious English boarding school.',
    coverImage: 'https://covers.openlibrary.org/b/id/8228698-L.jpg',
    genres: ['Science Fiction', 'Dystopian', 'Literary Fiction'],
    publishedYear: 2005,
    averageRating: 4.1,
    reviewCount: 16
  },
  {
    id: 'b0c1d2e3-f4a5-4b6c-7d8e-9f0a1b2c3d4e',
    title: 'The Wind-Up Bird Chronicle',
    author: 'Haruki Murakami',
    description: 'A Tokyo man searches for his missing wife, encountering a bizarre cast of characters and surreal events.',
    coverImage: 'https://covers.openlibrary.org/b/id/8228699-L.jpg',
    genres: ['Fiction', 'Magical Realism', 'Mystery'],
    publishedYear: 1994,
    averageRating: 4.0,
    reviewCount: 14
  },
  {
    id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
    title: 'The Pillars of the Earth',
    author: 'Ken Follett',
    description: 'A sweeping epic about the building of a cathedral in 12th-century England.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232000-L.jpg',
    genres: ['Historical Fiction', 'Drama', 'Epic'],
    publishedYear: 1989,
    averageRating: 4.3,
    reviewCount: 22
  },
  {
    id: 'd2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a',
    title: 'The Giver',
    author: 'Lois Lowry',
    description: 'A boy discovers the dark secrets behind his seemingly perfect society.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232001-L.jpg',
    genres: ['Young Adult', 'Dystopian', 'Science Fiction'],
    publishedYear: 1993,
    averageRating: 4.1,
    reviewCount: 19
  },
  {
    id: 'e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b',
    title: 'The Color Purple',
    author: 'Alice Walker',
    description: 'A story of African American women in early 20th-century rural Georgia.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232002-L.jpg',
    genres: ['Fiction', 'Classic', 'Historical Fiction'],
    publishedYear: 1982,
    averageRating: 4.2,
    reviewCount: 18
  },
  {
    id: 'f4a5b6c7-d8e9-4f0a-1b2c-3d4e5f6a7b8c',
    title: 'The Handmaid\'s Tale',
    author: 'Margaret Atwood',
    description: 'A dystopian novel set in a totalitarian society where women are subjugated.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232003-L.jpg',
    genres: ['Dystopian', 'Science Fiction', 'Feminism'],
    publishedYear: 1985,
    averageRating: 4.3,
    reviewCount: 21
  },
  {
    id: 'a5b6c7d8-e9f0-4a1b-2c3d-4e5f6a7b8c9d',
    title: 'Beloved',
    author: 'Toni Morrison',
    description: 'A former slave is haunted by the trauma of her past and the ghost of her dead child.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232004-L.jpg',
    genres: ['Fiction', 'Classic', 'Historical Fiction'],
    publishedYear: 1987,
    averageRating: 4.1,
    reviewCount: 17
  },
  {
    id: 'b6c7d8e9-f0a1-4b2c-3d4e-5f6a7b8c9d0e',
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry',
    description: 'A young prince explores the universe, learning about love, loss, and human nature.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232005-L.jpg',
    genres: ['Fiction', 'Classic', 'Philosophy'],
    publishedYear: 1943,
    averageRating: 4.6,
    reviewCount: 25
  },
  {
    id: 'c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f',
    title: 'The Catch-22',
    author: 'Joseph Heller',
    description: 'A satirical novel about the absurdities of war and bureaucracy.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232006-L.jpg',
    genres: ['Fiction', 'Classic', 'Satire'],
    publishedYear: 1961,
    averageRating: 4.0,
    reviewCount: 16
  },
  {
    id: 'd8e9f0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a',
    title: 'The Stranger',
    author: 'Albert Camus',
    description: 'A philosophical novel about the absurdity of life and the indifference of the universe.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232007-L.jpg',
    genres: ['Fiction', 'Philosophy', 'Classic'],
    publishedYear: 1942,
    averageRating: 4.1,
    reviewCount: 15
  },
  {
    id: 'e9f0a1b2-c3d4-4e5f-6a7b-8c9d0e1f2a3b',
    title: 'The Brothers Karamazov',
    author: 'Fyodor Dostoevsky',
    description: 'A philosophical novel about faith, doubt, and reason in 19th-century Russia.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232008-L.jpg',
    genres: ['Fiction', 'Classic', 'Philosophy'],
    publishedYear: 1880,
    averageRating: 4.5,
    reviewCount: 20
  },
  {
    id: 'f0a1b2c3-d4e5-4f6a-7b8c-9d0e1f2a3b4c',
    title: 'The Old Man and the Sea',
    author: 'Ernest Hemingway',
    description: 'An aging fisherman struggles with a giant marlin far out in the Gulf Stream.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232009-L.jpg',
    genres: ['Fiction', 'Classic', 'Adventure'],
    publishedYear: 1952,
    averageRating: 4.2,
    reviewCount: 18
  },
  {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    title: 'The Remains of the Day',
    author: 'Kazuo Ishiguro',
    description: 'A butler looks back on his life and lost opportunities in postwar England.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232010-L.jpg',
    genres: ['Fiction', 'Historical Fiction', 'Literary Fiction'],
    publishedYear: 1989,
    averageRating: 4.3,
    reviewCount: 17
  },
  {
    id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6f',
    title: 'White Teeth',
    author: 'Zadie Smith',
    description: 'A vibrant portrait of contemporary London life and multiculturalism.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232011-L.jpg',
    genres: ['Fiction', 'Contemporary', 'Literary Fiction'],
    publishedYear: 2000,
    averageRating: 4.0,
    reviewCount: 15
  },
  {
    id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7e',
    title: 'The Brief Wondrous Life of Oscar Wao',
    author: 'Junot Díaz',
    description: 'A multi-generational tale of a Dominican family and the curse that plagues them.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232012-L.jpg',
    genres: ['Fiction', 'Historical Fiction', 'Magical Realism'],
    publishedYear: 2007,
    averageRating: 4.1,
    reviewCount: 14
  },
  {
    id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8b',
    title: 'The Road to Character',
    author: 'David Brooks',
    description: 'An exploration of the deeper values that should inform our lives.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232013-L.jpg',
    genres: ['Non-Fiction', 'Philosophy', 'Self-Help'],
    publishedYear: 2015,
    averageRating: 4.0,
    reviewCount: 13
  },
  {
    id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9c',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    description: 'A groundbreaking tour of the mind and explanation of the two systems that drive the way we think.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232014-L.jpg',
    genres: ['Non-Fiction', 'Psychology', 'Science'],
    publishedYear: 2011,
    averageRating: 4.4,
    reviewCount: 22
  },
  {
    id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0d',
    title: 'The Art of War',
    author: 'Sun Tzu',
    description: 'An ancient Chinese military treatise dating from the Late Spring and Autumn Period.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232015-L.jpg',
    genres: ['Non-Fiction', 'Philosophy', 'History'],
    publishedYear: -500,
    averageRating: 4.3,
    reviewCount: 20
  },
  {
    id: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1e',
    title: 'The Glass Castle',
    author: 'Jeannette Walls',
    description: 'A memoir of resilience and redemption, and a look into a deeply dysfunctional yet uniquely vibrant family.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232016-L.jpg',
    genres: ['Memoir', 'Non-Fiction', 'Biography'],
    publishedYear: 2005,
    averageRating: 4.2,
    reviewCount: 18
  },
  {
    id: 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2f',
    title: 'The Power of Habit',
    author: 'Charles Duhigg',
    description: 'An exploration of the science behind why habits exist and how they can be changed.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232017-L.jpg',
    genres: ['Non-Fiction', 'Self-Help', 'Psychology'],
    publishedYear: 2012,
    averageRating: 4.3,
    reviewCount: 19
  },
  {
    id: 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3g',
    title: 'The Subtle Art of Not Giving a F*ck',
    author: 'Mark Manson',
    description: 'A counterintuitive approach to living a good life.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232018-L.jpg',
    genres: ['Non-Fiction', 'Self-Help', 'Psychology'],
    publishedYear: 2016,
    averageRating: 4.0,
    reviewCount: 17
  },
  {
    id: 'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4b',
    title: 'Educated Guess',
    author: 'Tara Westover',
    description: 'A collection of essays and reflections on the process of learning and self-discovery.',
    coverImage: 'https://covers.openlibrary.org/b/id/8232019-L.jpg',
    genres: ['Memoir', 'Non-Fiction', 'Education'],
    publishedYear: 2020,
    averageRating: 4.1,
    reviewCount: 12
  }
];

// Function to seed the books data
async function seedBooks() {
  try {
    const booksFilePath = getDataFilePath('books');
    await fs.writeFile(booksFilePath, JSON.stringify(books, null, 2));
    console.log('Books data seeded successfully!');
    return books;
  } catch (error) {
    console.error('Error seeding books data:', error);
    throw error;
  }
}

// Export seed functions
module.exports = {
  seedBooks
};
