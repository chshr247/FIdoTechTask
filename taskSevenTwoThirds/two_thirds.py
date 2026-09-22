class Node:
    def __init__(self, data, next=None):
        self.data = data
        self.next = next

class TwoThirdsOfLinkedList:
    def getTwoThirdsNode(self, head):
        if head is None or head.next is None:
            return None

        slow = head
        cur = head.next
        n = 2

        while cur.next is not None:
            cur = cur.next
            n += 1
            if n % 3 != 1:
                slow = slow.next
        return slow

def build(n):
    head = None
    for i in reversed(range(n)):
        head = Node(i, head)
    return head

for n in [3, 4, 5, 1, 0]: # test cases from example
    res = TwoThirdsOfLinkedList().getTwoThirdsNode(build(n))
    print(f"n = {n}, element = {res.data if res else None}")