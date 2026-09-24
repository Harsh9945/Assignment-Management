from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def build_pdf():
    pdf_filename = "d:/joineazy/submission/Harsh-Round2.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=12,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    link_style = ParagraphStyle(
        'LinkCustom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4,
        leftIndent=12
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("EduFlow — Technical Assessment Task 2", title_style))
    story.append(Paragraph("Candidate Submission Report & Deliverable Links | Candidate: <b>Harsh</b>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#e2e8f0"), spaceAfter=15))

    # Key Links Section
    story.append(Paragraph("1. Deliverables & Resource Links", h2_style))
    
    links_data = [
        [Paragraph("<b>GitHub Repository:</b>", body_style), Paragraph('<a href="https://github.com/Harsh9945/Assignment-Management">https://github.com/Harsh9945/Assignment-Management</a>', link_style)],
        [Paragraph("<b>Working Demo Video:</b>", body_style), Paragraph('<a href="https://drive.google.com/file/d/1MUETm5Hbiiz2wKYXwgF7FsGbTxGtxeT3/view?usp=sharing">https://drive.google.com/file/d/1MUETm5Hbiiz2wKYXwgF7FsGbTxGtxeT3/view?usp=sharing</a>', link_style)],
    ]

    link_table = Table(links_data, colWidths=[150, 380])
    link_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(link_table)
    story.append(Spacer(1, 15))

    # Architectural & Technical Summary Section
    story.append(Paragraph("2. Summary of Implemented Enhancements (Task 2)", h2_style))

    bullet_points = [
        "<b>UI/UX & Authentication Flow:</b> Implemented smooth JWT-based login/registration with inline form validation, loading spinners, and role-based redirection (Students to <code>/dashboard</code>, Professors to <code>/admin/dashboard</code>).",
        "<b>Course-Scoped Architecture:</b> Added multi-course support (CS101, SE302). Enrolled courses display in responsive grids with navigation to course-specific assignments (<code>/courses/:courseId/assignments</code>).",
        "<b>Submission Types (INDIVIDUAL vs GROUP):</b> Explicit submission mode badges. Individual assignments track single-student status; Group assignments enforce team-wide submission policies.",
        "<b>Atomic Group Leader Confirmation Fan-Out:</b> Group assignments restrict submission confirmation to the designated Group Leader (Aarav). Upon confirmation, an atomic PostgreSQL transaction updates submission status for all group members with <code>confirmed_by</code> attribution.",
        "<b>Professor Analytics & Management:</b> Admin dashboard displays total course enrollment, submission progress bars with smooth animations, status filtering (<code>CONFIRMED</code> vs <code>PENDING</code>), and assignment management.",
        "<b>Database Migrations & Test Suites:</b> Applied <code>002_courses.sql</code> schema migration, updated <code>seed_v3.js</code>, and validated end-to-end functionality across 7 Jest test suites."
    ]

    for pt in bullet_points:
        story.append(Paragraph(f"• {pt}", bullet_style))

    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=10))
    story.append(Paragraph("<b>Status:</b> All Task 2 requirements completed, verified with unit & integration tests, and pushed to GitHub.", body_style))

    doc.build(story)
    print("PDF generated successfully at:", pdf_filename)

if __name__ == "__main__":
    build_pdf()
