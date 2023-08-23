using System;

namespace StudentManagementSystem.cfasms
{
    internal class util
    {
        public static string createNewId(string institutionName)
        {

            // get institution abbreviation
            string abbreviation = getInstitutionAbbreviation(institutionName);
            // get current year
            string currentYear = DateTime.Now.Year.ToString();
            int studentCount = 1;
            return $"{abbreviation}-{currentYear}-{studentCount.ToString("D4")}";
        }

        public static string getInstitutionAbbreviation(string institutionName)
        {
            if (string.IsNullOrEmpty(institutionName))
            {
                throw new ArgumentNullException("Institution name cannot be null or empty.");
            }

            string[] words = institutionName.Split(' ');
            string abbreviation = "";

            if (words.Length == 1 && words[0].Length >= 3)
            {
                // If there's only one word and it has at least three letters, take the first three letters
                abbreviation = words[0].Substring(0, 3).ToUpper();
            }
            else
            {
                for (int i = 0; i < 3; i++)
                {
                    if (words.Length > i && !string.IsNullOrEmpty(words[i]))
                    {
                        abbreviation += char.ToUpper(words[i][0]);
                    }
                    else if (abbreviation.Length > 0)
                    {
                        abbreviation += abbreviation[0]; // Repeat the first letter if needed
                    }
                    else
                    {
                        // Handle other cases, such as a single word with less than three letters
                        // You may want to define a default abbreviation or throw an exception
                        throw new ArgumentException("Institution name must contain at least three characters.");
                    }
                }
            }

            return abbreviation;
        }


        public static string createUpdatedId(string lastUsedId)
        {
            string[] parts = lastUsedId.Split('-');
            string abbrev = parts[0];
            string year = parts[1];
            int studentNumber = int.Parse(parts[2]);

            // Check if the year matches the current year
            string currentYear = DateTime.Now.Year.ToString();
            if (year != currentYear)
            {
                studentNumber = 1; // Reset the student number if the year doesn't match
            }
            else
            {
                studentNumber++; // Increment the student number if the year matches
            }

            // Build the student college ID string
            return $"{abbrev}-{currentYear}-{studentNumber.ToString("D4")}";
        }
    }
}
