from collections import deque
from pathlib import Path
from PIL import Image

src = Path(
    r"C:\Users\acer\.cursor\projects\c-Users-acer-OneDrive-Desktop-foodApp-Ufitness-mobile-localtest\assets\c__Users_acer_AppData_Roaming_Cursor_User_workspaceStorage_393ea1ea149aa196772e8c83b240289d_images_OIP__2_-abea61fb-ff6b-4d42-a39f-8cc363ddc3aa.webp"
)
out = Path(r"c:\Users\acer\OneDrive\Desktop\foodApp\Ufitness_mobile_localtest\Ufitness\assets\uj-gym-logo.png")

img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size


def is_bg(r, g, b, a):
    return a > 0 and r >= 245 and g >= 245 and b >= 245


visited = [[False] * h for _ in range(w)]
q = deque()
for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
    r, g, b, a = pixels[x, y]
    if is_bg(r, g, b, a):
        q.append((x, y))
        visited[x][y] = True

while q:
    x, y = q.popleft()
    pixels[x, y] = (255, 255, 255, 0)
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
            r, g, b, a = pixels[nx, ny]
            if is_bg(r, g, b, a):
                visited[nx][ny] = True
                q.append((nx, ny))

# Clear near-white fringe next to already transparent pixels.
for x in range(w):
    for y in range(h):
        r, g, b, a = pixels[x, y]
        if a == 0:
            continue
        if r >= 250 and g >= 250 and b >= 250:
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and pixels[nx, ny][3] == 0:
                    pixels[x, y] = (r, g, b, 0)
                    break

img.save(out, "PNG")
print("saved", out, "size", img.size)
