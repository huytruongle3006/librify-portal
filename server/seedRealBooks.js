require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../src/models/Book');

// 60 tác phẩm kinh điển có thật 100% trong ngành CNTT & Khoa học
const realCatalog = [
    // 1. Kiến trúc phần mềm & Kỹ thuật lập trình
    { title: 'Clean Architecture: A Craftsman\'s Guide to Software Structure', author: 'Robert C. Martin', cat: 'Kiến trúc phần mềm' },
    { title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma, Richard Helm', cat: 'Kiến trúc phần mềm' },
    { title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', cat: 'Kiến trúc phần mềm' },
    { title: 'Refactoring: Improving the Design of Existing Code', author: 'Martin Fowler', cat: 'Kiến trúc phần mềm' },
    { title: 'Domain-Driven Design: Tackling Complexity in the Heart of Software', author: 'Eric Evans', cat: 'Kiến trúc phần mềm' },
    { title: 'Building Microservices: Designing Fine-Grained Systems', author: 'Sam Newman', cat: 'Kiến trúc phần mềm' },
    { title: 'Patterns of Enterprise Application Architecture', author: 'Martin Fowler', cat: 'Kiến trúc phần mềm' },
    { title: 'Software Engineering at Google: Lessons Learned from Programming', author: 'Titus Winters, Tom Manshreck', cat: 'Kiến trúc phần mềm' },
    { title: 'The Pragmatic Programmer: Your Journey To Mastery', author: 'David Thomas, Andrew Hunt', cat: 'Kiến trúc phần mềm' },
    { title: 'Continuous Delivery: Reliable Software Releases through Build Automation', author: 'Jez Humble, David Farley', cat: 'Kiến trúc phần mềm' },

    // 2. Hệ thống phân tán & Điện toán đám mây
    { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', cat: 'Hệ thống phân tán' },
    { title: 'Distributed Systems: Concepts and Design', author: 'George Coulouris', cat: 'Hệ thống phân tán' },
    { title: 'Site Reliability Engineering: How Google Runs Production Systems', author: 'Betsy Beyer, Chris Jones', cat: 'Hệ thống phân tán' },
    { title: 'Cloud Native Patterns: Designing high-availability clusters', author: 'Cornelia Davis', cat: 'Hệ thống phân tán' },
    { title: 'Kafka: The Definitive Guide - Real-Time Data and Stream Processing', author: 'Gwen Shapira, Neha Narkhede', cat: 'Hệ thống phân tán' },
    { title: 'Enterprise Integration Patterns: Designing, Building & Deploying', author: 'Gregor Hohpe, Bobby Woolf', cat: 'Hệ thống phân tán' },
    { title: 'Kubernetes Up & Running: Dive into the Future of Infrastructure', author: 'Kelsey Hightower, Brendan Burns', cat: 'Hệ thống phân tán' },
    { title: 'Database Internals: A Deep Dive into How Distributed Systems Work', author: 'Alex Petrov', cat: 'Hệ thống phân tán' },
    { title: 'Microservice Architecture: Aligning Principles, Practices & Culture', author: 'Irakli Nadareishvili', cat: 'Hệ thống phân tán' },
    { title: 'Understanding Distributed Systems: A compact guide', author: 'Roberto Vitillo', cat: 'Hệ thống phân tán' },

    // 3. Cơ sở dữ liệu & Quản trị dữ liệu
    { title: 'Database System Concepts (Silberschatz - Korth)', author: 'Abraham Silberschatz', cat: 'Cơ sở dữ liệu' },
    { title: 'Seven Databases in Seven Weeks: A Guide to Modern Databases', author: 'Luc Perkins, Eric Redmond', cat: 'Cơ sở dữ liệu' },
    { title: 'MongoDB: The Definitive Guide - Powerful and Scalable Storage', author: 'Shannon Bradshaw, Eoin Brazil', cat: 'Cơ sở dữ liệu' },
    { title: 'Redis in Action: Fast In-Memory Key-Value Data Store', author: 'Josiah L. Carlson', cat: 'Cơ sở dữ liệu' },
    { title: 'Learning SQL: Generate, Manipulate, and Retrieve Data', author: 'Alan Beaulieu', cat: 'Cơ sở dữ liệu' },
    { title: 'High Performance MySQL: Optimization, Backups, and Replication', author: 'Silvia Botros, Jeremy Tinley', cat: 'Cơ sở dữ liệu' },
    { title: 'Graph Databases: New Opportunities for Connected Data', author: 'Ian Robinson, Jim Webber', cat: 'Cơ sở dữ liệu' },
    { title: 'Cassandra: The Definitive Guide - Distributed Data at Web Scale', author: 'Jeff Carpenter, Eben Hewitt', cat: 'Cơ sở dữ liệu' },
    { title: 'NoSQL Distilled: A Brief Guide to the Emerging World of Polyglot', author: 'Pramod J. Sadalage', cat: 'Cơ sở dữ liệu' },
    { title: 'SQL Antipatterns: Avoiding the Pitfalls of Database Programming', author: 'Bill Karwin', cat: 'Cơ sở dữ liệu' },

    // 4. Khoa học máy tính & Thuật toán
    { title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen, Charles E. Leiserson', cat: 'Khoa học máy tính' },
    { title: 'The Art of Computer Programming (Volume 1: Fundamental Algorithms)', author: 'Donald E. Knuth', cat: 'Khoa học máy tính' },
    { title: 'Grokking Algorithms: An illustrated guide for programmers', author: 'Aditya Bhargava', cat: 'Khoa học máy tính' },
    { title: 'Algorithms (4th Edition)', author: 'Robert Sedgewick, Kevin Wayne', cat: 'Khoa học máy tính' },
    { title: 'Operating Systems: Three Easy Pieces (OSTEP)', author: 'Remzi H. Arpaci-Dusseau', cat: 'Khoa học máy tính' },
    { title: 'Structure and Interpretation of Computer Programs (SICP)', author: 'Harold Abelson, Gerald Jay Sussman', cat: 'Khoa học máy tính' },
    { title: 'Computer Systems: A Programmer\'s Perspective (CS:APP)', author: 'Randal E. Bryant, David R. O\'Hallaron', cat: 'Khoa học máy tính' },
    { title: 'Compilers: Principles, Techniques, and Tools (Dragon Book)', author: 'Alfred V. Aho, Monica S. Lam', cat: 'Khoa học máy tính' },
    { title: 'Computer Networking: A Top-Down Approach', author: 'James F. Kurose, Keith W. Ross', cat: 'Khoa học máy tính' },
    { title: 'The Linux Programming Interface', author: 'Michael Kerrisk', cat: 'Khoa học máy tính' },

    // 5. Trí tuệ nhân tạo & Khoa học dữ liệu
    { title: 'Artificial Intelligence: A Modern Approach (AIMA)', author: 'Stuart Russell, Peter Norvig', cat: 'Trí tuệ nhân tạo' },
    { title: 'Deep Learning (Adaptive Computation and Machine Learning)', author: 'Ian Goodfellow, Yoshua Bengio', cat: 'Trí tuệ nhân tạo' },
    { title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow', author: 'Aurélien Géron', cat: 'Trí tuệ nhân tạo' },
    { title: 'Pattern Recognition and Machine Learning', author: 'Christopher M. Bishop', cat: 'Trí tuệ nhân tạo' },
    { title: 'Speech and Language Processing (NLP)', author: 'Dan Jurafsky, James H. Martin', cat: 'Trí tuệ nhân tạo' },
    { title: 'Reinforcement Learning: An Introduction', author: 'Richard S. Sutton, Andrew G. Barto', cat: 'Trí tuệ nhân tạo' },
    { title: 'Python for Data Analysis: Data Wrangling with Pandas and NumPy', author: 'Wes McKinney', cat: 'Trí tuệ nhân tạo' },
    { title: 'Generative Deep Learning: Teaching Machines to Paint, Write and Play', author: 'David Foster', cat: 'Trí tuệ nhân tạo' },
    { title: 'Natural Language Processing with Transformers', author: 'Lewis Tunstall, Leandro von Werra', cat: 'Trí tuệ nhân tạo' },
    { title: 'Mathematics for Machine Learning', author: 'Marc Peter Deisenroth, A. Aldo Faisal', cat: 'Trí tuệ nhân tạo' },

    // 6. Công nghệ thông tin & Quản trị dự án
    { title: 'The Mythical Man-Month: Essays on Software Engineering', author: 'Frederick P. Brooks Jr.', cat: 'Công nghệ thông tin' },
    { title: 'Code Complete: A Practical Handbook of Software Construction', author: 'Steve McConnell', cat: 'Công nghệ thông tin' },
    { title: 'The Phoenix Project: A Novel about IT, DevOps, and Helping Your Business', author: 'Gene Kim, Kevin Behr', cat: 'Công nghệ thông tin' },
    { title: 'Accelerate: Building and Scaling High Performing Technology', author: 'Nicole Forsgren, Jez Humble', cat: 'Công nghệ thông tin' },
    { title: 'Cracking the Coding Interview: 189 Programming Questions', author: 'Gayle Laakmann McDowell', cat: 'Công nghệ thông tin' },
    { title: 'Working Effectively with Legacy Code', author: 'Michael C. Feathers', cat: 'Công nghệ thông tin' },
    { title: 'Release It!: Design and Deploy Production-Ready Software', author: 'Michael T. Nygard', cat: 'Công nghệ thông tin' },
    { title: 'The DevOps Handbook: How to Create World-Class Agility & Reliability', author: 'Gene Kim, Patrick Debois', cat: 'Công nghệ thông tin' },
    { title: 'Web Scalability for Startup Engineers', author: 'Artur Ejsmont', cat: 'Công nghệ thông tin' },
    { title: 'Modern Operating Systems (4th Edition)', author: 'Andrew S. Tanenbaum, Herbert Bos', cat: 'Công nghệ thông tin' }
];

// Danh sách URL ảnh bìa sách chất lượng cao từ thư viện ảnh Unsplash
const bookCovers = [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
    'https://images.unsplash.com/photo-1532012164546-f432f2e37b73?w=500',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500',
    'https://images.unsplash.com/photo-1507842229451-7f01be7fe829?w=500',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500',
    'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=500',
    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500',
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500'
];

async function seedRealBooks() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/digital_library';
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected...');

        // Xóa sách cũ
        await Book.deleteMany({});
        console.log('Đã làm sạch kho sách cũ...');

        // Chuẩn bị dữ liệu 60 sách
        const booksToInsert = realCatalog.map((item, index) => {
            const slug = item.title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-') + `-${index + 1}`;

            const coverImg = bookCovers[index % bookCovers.length];
            const views = Math.floor(Math.random() * (2500 - 650 + 1)) + 650;

            return {
                title: item.title,
                slug: slug,
                author: { name: item.author },
                categories: [item.cat],
                cover_image: coverImg,
                description: `Tác phẩm kinh điển về ${item.cat} do tác giả ${item.author} biên soạn. Cuốn sách cung cấp cơ sở lý thuyết vững chắc cùng hướng dẫn thực hành chuyên sâu trong thực tiễn ngành kỹ thuật phần mềm.`,
                total_chapters: 6,
                views: views,
                chapters: [
                    {
                        chapter_number: 1,
                        title: 'Chương 1: Khái niệm Cốt lõi & Nền tảng Lý thuyết',
                        slug: 'chuong-1-khai-niem-cot-loi',
                        content: 'Nội dung phân tích tổng quan ban đầu.',
                    },
                    {
                        chapter_number: 2,
                        title: 'Chương 2: Mô hình Thiết kế & Phân tích Cấu trúc',
                        slug: 'chuong-2-mo-hinh-thiet-ke',
                        content: 'Phân tích các mẫu hình và nguyên lý áp dụng.',
                    },
                    {
                        chapter_number: 3,
                        title: 'Chương 3: Quy trình Triển khai & Kiểm thử',
                        slug: 'chuong-3-quy-trinh-trien-khai',
                        content: 'Kỹ thuật thực thi và bảo đảm chất lượng hệ thống.',
                    },
                    {
                        chapter_number: 4,
                        title: 'Chương 4: Tối ưu Hóa Hiệu năng Thực thi',
                        slug: 'chuong-4-toi-uu-hoa-hieu-nang',
                        content: 'Giải pháp nâng cao thông lượng và giảm độ trễ.',
                    },
                    {
                        chapter_number: 5,
                        title: 'Chương 5: Nghiên cứu Tình huống Thực tế',
                        slug: 'chuong-5-nghien-cuu-tinh-huong',
                        content: 'Bài toán doanh nghiệp quy mô lớn.',
                    },
                    {
                        chapter_number: 6,
                        title: 'Chương 6: Xu hướng Tương lai & Tổng kết',
                        slug: 'chuong-6-xu-huong-tuong-lai',
                        content: 'Định hướng phát triển và các khuyến nghị vận hành.',
                    },
                ],
            };
        });

        await Book.insertMany(booksToInsert);
        console.log(`Đã nạp thành công ${booksToInsert.length} đầu sách thực tế 100% vào MongoDB!`);

        process.exit(0);
    } catch (error) {
        console.error('Lỗi nạp sách:', error);
        process.exit(1);
    }
}

seedRealBooks();