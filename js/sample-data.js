// This script adds sample test data to your Firestore database
// Run this in the browser console after logging in

async function addSampleTests() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error("You must be logged in to add sample data");
        return;
    }

    console.log("Adding sample tests for user:", user.uid);
    
    // Sample test data
    const sampleTests = [
        {
            name: "Core Values Assessment Q1 2023",
            userId: user.uid, // Associate with current user
            startDate: firebase.firestore.Timestamp.fromDate(new Date(2023, 0, 15)), // Jan 15, 2023
            endDate: firebase.firestore.Timestamp.fromDate(new Date(2023, 0, 30)), // Jan 30, 2023
            status: "completed",
            students: [
                "student1@example.com",
                "student2@example.com",
                "student3@example.com",
                "student4@example.com",
                "student5@example.com"
            ],
            results: {
                "student1@example.com": {
                    completed: true,
                    score: 92,
                    startTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 0, 16, 10, 30)),
                    endTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 0, 16, 11, 45))
                },
                "student2@example.com": {
                    completed: true,
                    score: 85,
                    startTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 0, 17, 14, 20)),
                    endTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 0, 17, 15, 35))
                },
                "student3@example.com": {
                    completed: true,
                    score: 78,
                    startTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 0, 18, 9, 15)),
                    endTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 0, 18, 10, 30))
                },
                "student4@example.com": {
                    completed: false,
                    startTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 0, 19, 11, 0))
                    // No endTime or score means not completed
                }
                // student5@example.com has no entry in results, meaning they never started
            }
        },
        {
            name: "Core Values Assessment Q2 2023",
            userId: user.uid, // Associate with current user
            startDate: firebase.firestore.Timestamp.fromDate(new Date(2023, 3, 1)), // Apr 1, 2023
            endDate: firebase.firestore.Timestamp.fromDate(new Date(2023, 3, 15)), // Apr 15, 2023
            status: "completed",
            students: [
                "student1@example.com",
                "student2@example.com",
                "student3@example.com",
                "student6@example.com"
            ],
            results: {
                "student1@example.com": {
                    completed: true,
                    score: 88,
                    startTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 3, 2, 13, 0)),
                    endTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 3, 2, 14, 15))
                },
                "student2@example.com": {
                    completed: true,
                    score: 95,
                    startTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 3, 3, 10, 30)),
                    endTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 3, 3, 11, 45))
                },
                "student3@example.com": {
                    completed: false,
                    startTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 3, 4, 15, 0))
                    // No endTime or score means not completed
                }
                // student6@example.com has no entry in results, meaning they never started
            }
        },
        {
            name: "Core Values Assessment Q3 2023",
            userId: user.uid, // Associate with current user
            startDate: firebase.firestore.Timestamp.fromDate(new Date(2023, 6, 10)), // Jul 10, 2023
            endDate: firebase.firestore.Timestamp.fromDate(new Date(2023, 6, 25)), // Jul 25, 2023
            status: "active",
            students: [
                "student1@example.com",
                "student2@example.com",
                "student3@example.com",
                "student4@example.com",
                "student5@example.com",
                "student6@example.com",
                "student7@example.com"
            ],
            results: {
                "student1@example.com": {
                    completed: true,
                    score: 90,
                    startTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 6, 11, 9, 0)),
                    endTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 6, 11, 10, 15))
                },
                "student2@example.com": {
                    completed: true,
                    score: 87,
                    startTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 6, 12, 14, 30)),
                    endTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 6, 12, 15, 45))
                },
                "student3@example.com": {
                    completed: false,
                    startTime: firebase.firestore.Timestamp.fromDate(new Date(2023, 6, 13, 11, 0))
                    // No endTime or score means not completed
                }
                // Other students have no entries in results, meaning they haven't started
            }
        },
        {
            name: "Core Values Assessment Q4 2023",
            userId: user.uid, // Associate with current user
            startDate: firebase.firestore.Timestamp.fromDate(new Date(2023, 9, 5)), // Oct 5, 2023
            endDate: firebase.firestore.Timestamp.fromDate(new Date(2023, 9, 20)), // Oct 20, 2023
            status: "draft",
            students: [
                "student1@example.com",
                "student2@example.com",
                "student3@example.com",
                "student4@example.com",
                "student5@example.com",
                "student6@example.com",
                "student7@example.com",
                "student8@example.com"
            ]
            // No results yet as it's a draft
        }
    ];

    try {
        // Add each test to Firestore
        for (const test of sampleTests) {
            const docRef = await firebase.firestore().collection('tests').add(test);
            console.log(`Added test: ${test.name} with ID: ${docRef.id}`);
        }
        
        console.log("All sample tests added successfully!");
        alert("Sample tests added successfully! Refresh the dashboard to see them.");
    } catch (error) {
        console.error("Error adding sample tests:", error);
        alert("Error adding sample tests. Check console for details.");
    }
}

// Function to run in the browser console
function runSampleData() {
    addSampleTests();
} 