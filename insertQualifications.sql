INSERT INTO Qualifications_Category (Category_Name, Level) VALUES
('Doctorate', 'Level 8'),
('Master', 'Level 7'),
('Professional Certification', 'Level 6');

-- Note: Holder_Staff_ID refers to Staff_ID 2 to 7 corresponding to the 6 professors (Alex Wong, Sarah Lee, David Cheung, Emily Chan, Michael Wong, Karen Ho)
INSERT INTO Qualifications (Title, Organization, Obtained_DT, Holder_Staff_ID, Qualification_Type_ID) VALUES
-- Staff 1: Alex Wong (Staff_ID: 2)
('Ph.D. in Computer Science', 'The University of Hong Kong', '2015-06-15', 2, 1),
('Certified Information Systems Security Professional (CISSP)', 'ISC2', '2018-11-20', 2, 3),

-- Staff 2: Prof. Sarah Lee (Staff_ID: 3)
('Ph.D. in Artificial Intelligence', 'Stanford University', '2012-05-20', 3, 1),
('M.Sc. in Computer Science', 'The Chinese University of Hong Kong', '2008-07-10', 3, 2),

-- Staff 3: Dr. David Cheung (Staff_ID: 4)
('Ph.D. in Business Administration', 'London Business School', '2010-09-30', 4, 1),
('Chartered Financial Analyst (CFA)', 'CFA Institute', '2013-08-12', 4, 3),

-- Staff 4: Dr. Emily Chan (Staff_ID: 5)
('Ph.D. in Applied Mathematics', 'Oxford University', '2017-07-04', 5, 1),
('M.Sc. in Statistics', 'The Hong Kong University of Science and Technology', '2013-11-15', 5, 2),

-- Staff 5: Prof. Michael Wong (Staff_ID: 6)
('Ph.D. in Software Engineering', 'Massachusetts Institute of Technology', '2005-06-01', 6, 1),
('AWS Certified Solutions Architect - Professional', 'Amazon Web Services', '2019-03-22', 6, 3),

-- Staff 6: Dr. Karen Ho (Staff_ID: 7)
('Ph.D. in Marketing', 'National University of Singapore', '2018-12-18', 7, 1),
('Certified Digital Marketing Professional', 'Digital Marketing Institute', '2020-04-10', 7, 3);