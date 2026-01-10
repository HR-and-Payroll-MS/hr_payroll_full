{/* <div class="border border-blue-300 shadow rounded-md p-4 max-w-sm w-full mx-auto">
  <div class="animate-pulse flex space-x-4">
    <div class="rounded-full bg-slate-700 h-10 w-10"></div>
    <div class="flex-1 space-y-6 py-1">
      <div class="h-2 bg-slate-700 rounded"></div>
      <div class="space-y-3">
        <div class="grid grid-cols-3 gap-4">
          <div class="h-2 bg-slate-700 rounded col-span-2"></div>
          <div class="h-2 bg-slate-700 rounded col-span-1"></div>
        </div>
        <div class="h-2 bg-slate-700 rounded"></div>
      </div>
    </div>
  </div>
</div>
// Example of a loading skeleton animation using Tailwind CSS

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skeleton Loader</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css"></script>
    <style>
        @keyframes shimmer {
            0% {
                background-position: -1000px 0;
            }
            100% {
                background-position: 1000px 0;
            }
        }

        .animate-shimmer {
            animation: shimmer 2s infinite linear;
            background: linear-gradient(to right, #f6f7f8 4%, #edeef1 25%, #f6f7f8 36%);
            background-size: 1000px 100%;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen p-8">
    <div class="max-w-4xl mx-auto space-y-8">
        <!-- Card Skeleton -->
        <div class="bg-white rounded-xl p-6 shadow-lg space-y-4">
            <div class="flex items-center space-x-4">
                <!-- Avatar Skeleton -->
                <div class="w-12 h-12 rounded-full animate-shimmer"></div>
                <!-- Name and Title Skeleton -->
                <div class="space-y-2 flex-1">
                    <div class="h-4 w-1/4 animate-shimmer rounded"></div>
                    <div class="h-3 w-1/3 animate-shimmer rounded"></div>
                </div>
            </div>
            <!-- Content Skeleton -->
            <div class="space-y-3">
                <div class="h-4 w-full animate-shimmer rounded"></div>
                <div class="h-4 w-full animate-shimmer rounded"></div>
                <div class="h-4 w-3/4 animate-shimmer rounded"></div>
            </div>
        </div>

        <!-- List Skeleton -->
        <div class="bg-white rounded-xl p-6 shadow-lg space-y-4">
            <!-- List Item Skeletons -->
            <div class="space-y-4">
                <div class="flex items-center space-x-4">
                    <div class="w-8 h-8 rounded animate-shimmer"></div>
                    <div class="flex-1 h-4 animate-shimmer rounded"></div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="w-8 h-8 rounded animate-shimmer"></div>
                    <div class="flex-1 h-4 animate-shimmer rounded"></div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="w-8 h-8 rounded animate-shimmer"></div>
                    <div class="flex-1 h-4 animate-shimmer rounded"></div>
                </div>
            </div>
        </div>

        <!-- Grid Skeleton -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Grid Item Skeletons -->
            <div class="bg-white rounded-xl p-4 shadow-lg space-y-3">
                <div class="w-full h-48 rounded animate-shimmer"></div>
                <div class="h-4 w-3/4 animate-shimmer rounded"></div>
                <div class="h-3 w-1/2 animate-shimmer rounded"></div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-lg space-y-3">
                <div class="w-full h-48 rounded animate-shimmer"></div>
                <div class="h-4 w-3/4 animate-shimmer rounded"></div>
                <div class="h-3 w-1/2 animate-shimmer rounded"></div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-lg space-y-3">
                <div class="w-full h-48 rounded animate-shimmer"></div>
                <div class="h-4 w-3/4 animate-shimmer rounded"></div>
                <div class="h-3 w-1/2 animate-shimmer rounded"></div>
            </div>
        </div>
    </div>
</body>
</html>
loading skeleton */}






// ........................................ notification pop doom ...........................................
// <span class="relative flex h-3 w-3">
//   <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
//   <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
// </span>

