require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./src/models/Book');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_library';

// Danh mục chủ đề chuyên sâu cho 6 chương sách
const chapterTemplates = [
  {
    titleSuffix: 'Khái niệm Cốt lõi & Nền tảng Lý thuyết',
    pages: 25,
    lead: 'Tổng quan nền tảng, bối cảnh hình thành và các khái niệm cơ sở định hình toàn bộ lĩnh vực nghiên cứu.',
    analysis: 'Các nguyên lý cơ bản đóng vai trò là kim chỉ nam giúp phân tách bài toán phức tạp thành các thành phần độc lập có thể kiểm soát được. Việc nắm vững lý thuyết nền tảng giúp kỹ sư đưa ra các quyết định kiến trúc chính xác ngay từ giai đoạn khởi tạo.',
    takeaway: 'Nền tảng vững chắc là điều kiện tiên quyết để đảm bảo tính ổn định và khả năng mở rộng của hệ thống sau này.'
  },
  {
    titleSuffix: 'Mô hình Thiết kế & Phân tích Cấu trúc',
    pages: 26,
    lead: 'Đi sâu vào mô hình hóa dữ liệu, kiến trúc phân tầng và phân định ranh giới giữa các thành phần phần mềm.',
    analysis: 'Thiết kế cấu trúc tối ưu đòi hỏi việc cô lập các quy tắc nghiệp vụ khỏi các phụ thuộc bên ngoài như giao diện hoặc cơ sở dữ liệu. Sử dụng các mẫu thiết kế hướng đối tượng và kiến trúc Clean Architecture giúp hệ thống linh hoạt trước mọi thay đổi công nghệ.',
    takeaway: 'Tính module hóa cao giúp giảm thiểu nợ kỹ thuật (Technical Debt) và gia tăng độ tin cậy khi triển khai đa môi trường.'
  },
  {
    titleSuffix: 'Quy trình Triển khai & Kiến trúc Polyglot',
    pages: 28,
    lead: 'Chiến lược phối hợp đa cơ sở dữ liệu (Polyglot Persistence) nhằm dung hòa giữa tính bền vững và tốc độ truy xuất.',
    analysis: 'Hệ thống kết hợp sức mạnh lưu trữ tài liệu có cấu trúc linh hoạt của MongoDB với khả năng phản hồi mili-giây của Redis In-Memory. MongoDB đảm nhiệm lưu trữ nội dung toàn văn của các chương mục, trong khi Redis lưu giữ trạng thái đọc dở tức thì (Hashes) và bảng xếp hạng thịnh hành (ZSET).',
    takeaway: 'Sự phân công đúng cơ sở dữ liệu cho đúng tác vụ giúp hệ thống chịu tải cao mà không phát sinh nghẽn cổ chai.'
  },
  {
    titleSuffix: 'Tối ưu Hóa Hiệu năng & Bộ nhớ Tạm Phân tán',
    pages: 27,
    lead: 'Kỹ thuật tối ưu hóa truy vấn, chiến lược Cache-Aside, lập chỉ mục (Indexing) và kiểm soát tính nhất quán.',
    analysis: 'Việc áp dụng cơ chế khóa tạm thời (Cooldown TTL) giúp ngăn chặn hiện tượng spam lượt đọc ảo và bảo vệ cơ sở dữ liệu chính khỏi tình trạng quá tải (Cache Stampede). Cơ chế nạp bất đồng bộ giúp độc giả lật trang mượt mà với độ trễ gần như bằng không.',
    takeaway: 'Tối ưu hóa bộ nhớ tạm là chìa khóa để vận hành các ứng dụng phục vụ hàng ngàn người dùng đồng thời.'
  },
  {
    titleSuffix: 'Nghiên cứu Tình huống Thực tế & Vận hành',
    pages: 29,
    lead: 'Khảo sát các kịch bản thực tiễn khi đưa giải pháp vào môi trường sản xuất thực tế với quy mô lớn.',
    analysis: 'Khi đối mặt với sự cố mạng hoặc lỗi phần cứng đột ngột, việc lưu vết tiến trình tức thì cho phép người dùng khôi phục phiên làm việc chính xác đến từng trang sách ngay khi mở lại ứng dụng. Dữ liệu sao lưu định kỳ trên MongoDB đảm bảo không xảy ra thất thoát tri thức.',
    takeaway: 'Kiến trúc phục hồi sau sự cố (Fault Tolerance) là thước đo chất lượng của một giải pháp phần mềm chuyên nghiệp.'
  },
  {
    titleSuffix: 'Xu hướng Tương lai & Tổng kết Chuyên đề',
    pages: 30,
    lead: 'Tổng kết toàn bộ chuỗi luận điểm, đánh giá triển vọng nâng cấp và tích hợp các công nghệ thông minh tiếp theo.',
    analysis: 'Sự phát triển của trí tuệ nhân tạo và hệ thống phân tán mở ra cơ hội cá nhân hóa lộ trình đọc sách cho từng độc giả. Bằng việc phân tích lịch sử đọc (Redis List) và xu hướng tương tác, hệ thống có thể chủ động gợi ý những chuyên đề phù hợp nhất.',
    takeaway: 'Hệ thống thư viện số hiện đại không chỉ là nơi lưu trữ sách mà là một nền tảng tri thức động phục vụ cộng đồng học thuật.'
  }
];

// Hàm tạo chuỗi nội dung văn bản học thuật dài cho trường content
function createChapterFullContent(bookTitle, chapterIndex, template) {
  const paragraphs = [
    `Chào mừng bạn đến với Chương ${chapterIndex + 1}: ${template.titleSuffix} thuộc tài liệu "${bookTitle}".`,
    template.lead,
    `Trong toàn bộ ${template.pages} trang của chương này, bạn sẽ tiếp cận các phương pháp luận chuẩn xác được kiểm chứng qua thực tế kỹ thuật:`,
    template.analysis,
    `Điểm mấu chốt cần ghi nhớ: "${template.takeaway}".`,
    `Tất cả dữ liệu phân đoạn này được lập chỉ mục trực tiếp trong MongoDB, đồng thời kết nối chặt chẽ với cơ chế bộ nhớ đệm Redis nhằm mang lại trải nghiệm đọc sách liên tục và mượt mà nhất.`
  ];
  return paragraphs.join('\n\n');
}

async function ensureAllBooksHaveChapters() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối cơ sở dữ liệu MongoDB thành công!');

    const books = await Book.find({});
    console.log(`📚 Đang quét và kiểm tra dữ liệu cho ${books.length} cuốn sách...`);

    let count = 0;

    for (const book of books) {
      // Ép chuẩn mỗi cuốn sách đều có đúng 6 chương đầy đủ
      const fullChapters = chapterTemplates.map((template, idx) => {
        const chapTitle = `Chương ${idx + 1}: ${template.titleSuffix}`;
        return {
          chapter_number: idx + 1,
          title: chapTitle,
          slug: `chuong-${idx + 1}`,
          total_pages: template.pages,
          word_count: 950 + (idx * 60),
          content: createChapterFullContent(book.title, idx, template),
          created_at: new Date()
        };
      });

      book.chapters = fullChapters;
      book.total_chapters = fullChapters.length;

      book.markModified('chapters');
      await book.save();
      count++;
    }

    console.log(`🎉 HOÀN TẤT TUYỆT ĐỐI! Đã chuẩn hóa toàn bộ ${count} cuốn sách: Mỗi cuốn đều có đủ 6 chương nội dung toàn văn phong phú.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi xử lý:', error);
    process.exit(1);
  }
}

ensureAllBooksHaveChapters();