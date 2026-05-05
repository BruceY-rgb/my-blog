n = int(input())

for i in range(n//2):
    print(f'{'*'*(2*i+1):^11}')
for i in range(n//2, -1, -1):
    print(f'{'*'*(2*i+1):^11}')